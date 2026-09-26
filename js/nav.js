// Navegación: utilidades para cambiar entre páginas del aula

function goToChat(mode) {
  localStorage.setItem('racoon_mode', mode);
  if (typeof navigateTo === 'function') {
    navigateTo('chat.html');
  } else {
    window.location.href = 'chat.html';
  }
}
