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

  socket.on('new price', function(data) {
    console.log(document.getElementById(`${data[0]}-actual`))
    if(document.getElementById(`${data[0]}-actual`)) {
      const actual = document.getElementById(`${data[0]}-actual`);
      const difference = document.getElementById(`${data[0]}-difference`);
      actual.style.fontWeight = 900;
      difference.style.fontWeight = 900;
      actual.innerHTML = data[1];
      difference.innerHTML = data[2];
      setTimeout(function() {
        actual.style.fontWeight = 200;
        difference.style.fontWeight = 200;
      }, 2000);
    }
    console.log(data);
  })

}());
