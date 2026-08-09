/* ==============================
   NAV — js/nav.js HELPER DE NAVEGACIÓN A CHAT
   ============================== */

function goToChat(mode) {
  localStorage.setItem('racoon_mode', mode);
  if (typeof navigateTo === 'function') {
    navigateTo('chat.html');
  } else {
    window.location.href = 'chat.html';
  }
}
