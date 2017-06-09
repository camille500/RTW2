(function() {

  const socket = io();

  socket.on('stock change', function(data) {
    console.log(data)
    const element = document.getElementById(data.ticker);
    element.style.color = 'red';
    element.innerHTML = `${data.difference}%`;
    setTimeout(function() {
      element.style.color = 'black';
    }, 2000)
  });

}());
