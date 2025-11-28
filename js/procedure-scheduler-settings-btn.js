// Open HIS modal handler
(function(){
  const btn = document.getElementById('btnOpenSettings');
  if (btn) {
    btn.addEventListener('click', function(){
      if (window.openHISModal) {
        window.openHISModal();
      }
    });
  }
})();
