// Transiciones de página
function navigateTo(url) {
  document.body.classList.add('page-exit');
  setTimeout(() => {
    window.location.href = url;
  }, 250);
}

window.navigateTo = navigateTo;
