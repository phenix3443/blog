import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ProjectChecks(unittest.TestCase):
    def test_theme_configuration(self):
        for environment, domain in {
            "production": "blog.panghuli.cn",
            "development": "blog.panghuli.cn",
        }.items():
            with self.subTest(environment=environment):
                result = subprocess.run(
                    ["hugo", "config", "--environment", environment, "--format", "json"],
                    cwd=ROOT, text=True, capture_output=True, check=True,
                )
                config = json.loads(result.stdout[result.stdout.index("{"):])
                self.assertEqual(config["baseurl"].rstrip("/"), f"https://{domain}")
                self.assertEqual([module["path"] for module in config["module"]["imports"]],
                                 ["github.com/hugo-fixit/FixIt"])
                self.assertEqual(config["params"]["header"]["title"]["name"], "phenix3443")
                self.assertEqual(config["defaultcontentlanguage"], "zh-cn")

    def test_hugo_versions_are_consistent(self):
        for path in ROOT.glob("vercel*.json"):
            config = json.loads(path.read_text())
            self.assertEqual(config["env"]["HUGO_VERSION"], "0.170.1")
            self.assertNotIn("0.147.2", config["installCommand"])
            self.assertNotIn("0.157.0", config["installCommand"])
        for path in (ROOT / ".github/workflows").glob("*.yml"):
            for line in path.read_text().splitlines():
                if "HUGO_VERSION:" in line:
                    self.assertEqual(line.split(":", 1)[1].strip(), "0.170.1")

    def run_deploy(self, fail_project="", missing=False):
        with tempfile.TemporaryDirectory() as directory:
            directory = Path(directory)
            script = directory / "deploy-vercel.sh"
            script.write_bytes((ROOT / "deploy-vercel.sh").read_bytes())
            for name in ("vercel.json", "vercel.fixit.json"):
                (directory / name).write_bytes((ROOT / name).read_bytes())
            (directory / ".vercel").mkdir()
            metadata = directory / ".vercel/project.json"
            metadata.write_text('{"projectId":"original"}')
            cli = directory / "vercel"
            cli.write_text(
                '#!/bin/bash\n'
                'printf "%s %s\\n" "$VERCEL_PROJECT_ID" "$*" >> "$CALL_LOG"\n'
                'if [[ "$VERCEL_PROJECT_ID" == "$FAIL_PROJECT" ]]; then exit 42; fi\n'
            )
            cli.chmod(0o755)
            environment = dict(os.environ, PATH=f"{directory}:{os.environ['PATH']}",
                               VERCEL_ORG_ID="org-test", VERCEL_PROJECT_ID_BOOTSTRAP="bootstrap-id",
                               VERCEL_PROJECT_ID_FIXIT="fixit-id", FAIL_PROJECT=fail_project,
                               CALL_LOG=str(directory / "calls"))
            if missing:
                environment.pop("VERCEL_PROJECT_ID_FIXIT")
            before = {p: p.read_bytes() for p in (metadata, directory / "vercel.json", directory / "vercel.fixit.json")}
            result = subprocess.run(["bash", str(script)], cwd="/tmp", env=environment, capture_output=True)
            for path, contents in before.items():
                self.assertEqual(path.read_bytes(), contents)
            calls = (directory / "calls").read_text().splitlines() if (directory / "calls").exists() else []
            return result.returncode, calls

    def test_deploy_selects_distinct_projects_without_rewriting_files(self):
        code, calls = self.run_deploy()
        self.assertEqual(code, 0)
        self.assertEqual(calls, [
            "bootstrap-id deploy --local-config vercel.json --prod --yes",
            "fixit-id deploy --local-config vercel.fixit.json --prod --yes",
        ])

    def test_deploy_failure_preserves_configuration(self):
        code, calls = self.run_deploy(fail_project="fixit-id")
        self.assertEqual(code, 42)
        self.assertEqual(len(calls), 2)

    def test_deploy_missing_project_stops_before_publishing(self):
        code, calls = self.run_deploy(missing=True)
        self.assertNotEqual(code, 0)
        self.assertEqual(calls, [])

    def test_deploy_first_failure_stops_second_project(self):
        code, calls = self.run_deploy(fail_project="bootstrap-id")
        self.assertEqual(code, 42)
        self.assertEqual(len(calls), 1)
