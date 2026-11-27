(() => {
  const widget = document.querySelector('[data-visitor-stats]');
  if (!widget || location.hostname !== widget.dataset.visitorHost) return;
  const script = document.createElement('script');
  script.src = widget.dataset.visitorSource;
  script.defer = true;
  document.head.append(script);
})();
