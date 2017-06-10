(function() {

  const socket = io();

  socket.on('stock change', function(data) {
    if(document.getElementById(data.ticker)) {
      const element = document.getElementById(data.ticker);
      element.style.fontWeight = 900;
      if(data.difference <= 0) {
        element.style.color = 'red';
      } else {
        element.style.color = 'green';
      }
      element.innerHTML = `${data.difference}%`;
      setTimeout(function() {
        element.style.fontWeight = 200;
      }, 2000);
    }
  });

}());
