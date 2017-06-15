(function() {

  const socket = io();

  socket.on('stock change', function(data) {
    if(document.getElementById(data.ticker)) {
      const element = document.getElementById(data.ticker);
      if(data.difference <= 0) {
        element.classList.add('stock_down');
      } else {
        element.classList.add('stock_up');
      }
      element.innerHTML = `${data.difference}%`;
      setTimeout(function() {
        if(data.difference <= 0) {
          element.classList.remove('stock_down');
        } else {
          element.classList.remove('stock_up');
        }
      }, 2000);
    }
  });

  socket.on('new price', function(data) {
    if(document.getElementById(`${data[0]}-actual`)) {
      const difference = document.getElementById(`${data[0]}-difference`);
      if(difference.innerHTML != data[2]) {
        if(data[2] <= 0) {
          difference.classList.add('stock_down');
        } else {
          difference.classList.add('stock_up');
        }
        difference.innerHTML = data[2];
        setTimeout(function() {
          if(data[2] <= 0) {
            difference.classList.remove('stock_down');
          } else {
            difference.classList.remove('stock_up');
          }
        }, 2000);
      }
    }
  });

}());
