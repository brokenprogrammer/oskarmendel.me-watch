var username = "JohnDoe"
var player;
function onYouTubeIframeAPIReady() {
    console.log("Does it happen?");
    player = new YT.Player('player', {
      height: '390',
      width: '640',
      videoId: 'Z7CTnA3dTU0',
      playerVars: {
        'autoplay': 1,
        'controls': 0
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
}

// The API will call this function when the video player is ready.
function onPlayerReady(event) {
    event.target.playVideo();
    console.log("Total Time: " + player.getDuration());
    console.log("Current Time: " + player.getCurrentTime());
}

// API will call this function when the video player changes states.
function onPlayerStateChange(event) {
    console.log("Total Time: " + player.getDuration());
    console.log("Current Time: " + player.getCurrentTime());
    //videototaltime.html(1902);
    //$('#videototaltime').html(player.getDuration());
    //$('#videocurrenttime').html(player.getCurrentTime());
}

//New browser interval to update the video player times.
window.setInterval(function() {
    var totaltimeMin = Math.floor(player.getDuration()/60);
    var totaltimeSec = Math.floor(player.getDuration() - totaltimeMin * 60);

    var currenttimeMin = Math.floor(player.getCurrentTime()/60);
    var currenttimeSec = Math.floor(player.getCurrentTime() - currenttimeMin * 60);
    $('#videototaltime').html(totaltimeMin + ":" + totaltimeSec);
    $('#videocurrenttime').html(currenttimeMin + ":" + currenttimeSec);
}, 1000);

$(document).ready(function() {
          //This code loads the IFrame Player API code asynchronously.
          var tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          //Set the username form to fullscreen
          document.getElementById("usernameSelector").style.width = "100%";

            // Use a "/test" namespace.
            // An application can open a connection on multiple namespaces, and
            // Socket.IO will multiplex all those connections on a single
            // physical channel. If you don't care about multiple channels, you
            // can set the namespace to an empty string.
            namespace = '/test';

            // Connect to the Socket.IO server.
            // The connection URL has the following format:
            //     http[s]://<domain>:<port>[/<namespace>]
            var socket = io.connect('http://' + document.domain + ':' + location.port + namespace);

            // Event handler for new connections.
            // The callback function is invoked when a connection with the
            // server is established.
            socket.on('connect', function() {
                socket.emit('my event', {data: 'I\'m connected!'});
            });

            // Event handler for server sent data.
            // The callback function is invoked whenever the server emits data
            // to the client. The data is then displayed in the "Received"
            // section of the page.
            socket.on('my response', function(msg) {
                $('#log').append('<br>' + $('<div/>').text('Received #' + msg.count + ': ' + msg.data).html());
                $(".messageBox").animate({ scrollTop: $(document).height() }, "slow");
            });

            //Event Handler for updating the youtube video in the iframe.
            socket.on('update video', function(msg) {
                //$('#videoplayer').attr('src',msg.data);
                player.loadVideoById(msg.data, 0, "large");
            });

            //When the play/pause button was pressed
            socket.on('videoplaypause', function(msg){
                console.log("Server video playing: " + msg.data);
                if (!msg.data) {
                    player.pauseVideo();
                } else {
                    player.playVideo();
                }
            });

            // Interval function that tests message latency by sending a "ping"
            // message. The server then responds with a "pong" message and the
            // round trip time is measured.
            var ping_pong_times = [];
            var start_time;
            window.setInterval(function() {
                start_time = (new Date).getTime();
                socket.emit('my ping');
            }, 1000);

            // Handler for the "pong" message. When the pong is received, the
            // time from the ping is stored, and the average of the last 30
            // samples is average and displayed.
            socket.on('my pong', function() {
                var latency = (new Date).getTime() - start_time;
                ping_pong_times.push(latency);
                ping_pong_times = ping_pong_times.slice(-30); // keep last 30 samples
                var sum = 0;
                for (var i = 0; i < ping_pong_times.length; i++)
                    sum += ping_pong_times[i];
                $('#ping-pong').text(Math.round(10 * sum / ping_pong_times.length) / 10);
            });

            // Handlers for the different forms in the page.
            // These accept data from the user and send it to the server in a
            // variety of ways

            $('form#setusername').submit(function(event){
                username = $('#username').val();

                //Remove overlay
                document.getElementById("usernameSelector").style.width = "0";
                return false;
            });
            $('form#emit').submit(function(event) {
                socket.emit('my event', {data: $('#emit_data').val()});
                return false;
            });
            $('form#broadcast').submit(function(event) {
                socket.emit('my broadcast event', {data: $('#broadcast_data').val()});
                $('#broadcast_data').val("");
                return false;
            });
            $('form#join').submit(function(event) {
                socket.emit('join', {room: $('#join_room').val()});
                return false;
            });
            $('form#leave').submit(function(event) {
                socket.emit('leave', {room: $('#leave_room').val()});
                return false;
            });
            $('form#send_room').submit(function(event) {
                socket.emit('my room event', {room: $('#room_name').val(), data: $('#room_data').val()});
                return false;
            });
            $('form#close').submit(function(event) {
                socket.emit('close room', {room: $('#close_room').val()});
                return false;
            });
            $('form#disconnect').submit(function(event) {
                socket.emit('disconnect request');
                return false;
            });
            $('form#ytube').submit(function(event) {
                socket.emit('setytube', {data: $('#thelink').val()});
                return false;
            });
            $('form#videoplaypause').submit(function(event) {
                socket.emit('videoplaypause');
                return false;
            });

            //When user changed the volume in the slider under the video.
            $('#videovolume').change(function(){
                //currentValue.html(this.value);
                console.log("Setting player volune to: " + this.value);
                player.setVolume(this.value);
            });

            $('#videofullscreen').click(function(){
                var playerElement = document.getElementById("player");

                //Fullscreen support for most browsers.
                var requestFullScreen = playerElement.requestFullScreen || playerElement.msRequestFullscreen || playerElement.mozRequestFullScreen || playerElement.webkitRequestFullScreen;
                  if (requestFullScreen) {
                    requestFullScreen.bind(playerElement)();
                  }
            });
});
