(function() {

  const socket = io();

  socket.on('stock change', function(data) {
    console.log(data)
  });

}());
