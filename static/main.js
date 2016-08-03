var username = "JohnDoe"
var player;
var socket;
var connected = false;
var historyRetrieved = false;
var APIKEY = 'AIzaSyDix5HFqkBhlUv3hvXb_ZkuXbQzAki0mKk';

function googleApiClientReady() {
    gapi.client.setApiKey(APIKEY);
    gapi.client.load('youtube', 'v3', function() {
        //Youtube API ready
        console.log("Youtube Data Api Ready.");
    });
}

$(document).ready(function() {
          //Set the username form to fullscreen
          console.log("Setting fullscreen for username.");
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
            console.log("Initializing socket.");
            socket = io.connect('http://' + document.domain + ':' + location.port + namespace);

            // Event handler for new connections.
            // The callback function is invoked when a connection with the
            // server is established.
            socket.on('connect', function() {
                console.log("Socket on connect..");
                connected = true;
                socket.emit('my response', {data: 'I\'m connected!'});
                addYoutubeIframeAPI();
            });

            // Event handler for server sent data.
            // The callback function is invoked whenever the server emits data
            // to the client. The data is then displayed in the "Received"
            // section of the page.
            socket.on('my response', function(msg) {
                if (msg.user) {
                    $('#log').append('<br>' + $('<div/>').text(msg.user + ': ' + msg.data).html());
                } else {
                    $('#log').append('<br>' + $('<div/>').text('Received #' + ': ' + msg.data).html());
                }
                $(".messageBox").animate({ scrollTop: $("#log").height() }, "slow");
            });

            socket.on('sethistory', function(msg){
                if(msg.data){
                    console.log("Retrieved history");
                    var history = msg.data;
                    for (var i = 0; i < history.length; i++) {
                        //Requesting video per video from youtube data api.
                        var request = gapi.client.youtube.search.list({
                            part: 'snippet',
                            maxResults: 1,
                            order: 'relevance',
                            type: 'video',
                            q: history[i]
                        });

                        //Execute the request
                        request.execute(function(response) {
                        var results = response.result;
                        console.log(results);
                        var title = results.items[0].snippet.title;
                        var description = results.items[0].snippet.description;
                        var thumbnail = results.items[0].snippet.thumbnails.default.url;
                        //$('#historyTab').append('<br>' + $('<div/>').text(title + description + thumbnail).html());

                        $('#historyTab').append('<div class="video"><div class="video-img" style="background-image: url(' + thumbnail + ')"></div><h5 class="video-title">' + title + '</h5></div>');
                        });
                    }
                    historyRetrieved = true;
                }
            });

            //Event Handler for updating the youtube video in the iframe.
            socket.on('update video', function(msg) {
                //$('#videoplayer').attr('src',msg.data);
                if (player) {
                    player.loadVideoById(msg.data, 0, "default");

                    var request = gapi.client.youtube.search.list({
                            part: 'snippet',
                            maxResults: 1,
                            order: 'relevance',
                            type: 'video',
                            q: msg.data
                        });

                        //Execute the request
                        request.execute(function(response) {
                        var results = response.result;
                        var title = results.items[0].snippet.title;
                        var description = results.items[0].snippet.description;
                        var thumbnail = results.items[0].snippet.thumbnails.default.url;
                        var alreadyExist = false;
                        $('.video').each(function(index) {
                            if ($(this).has('.video-title').text() == title) {
                                alreadyExist = true;
                            }
                        });
                        if (!alreadyExist) {
                            $('#historyTab').append('<div class="video"><div class="video-img" style="background-image: url(' + thumbnail + ')"></div><h5 class="video-title">' + title + '</h5></div>');
                        }
                        });

                }
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
            /*var ping_pong_times = [];
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
            });*/

            // Handlers for the different forms in the page.
            // These accept data from the user and send it to the server in a
            // variety of ways

            $('form#setusername').submit(function(event){
                username = $('#username').val();
                //Remove overlay
                document.getElementById("usernameSelector").style.width = "0";

                //Load Curent video:
                socket.emit('getvideodata');
                socket.emit('inithistory');
                return false;
            });
            $('form#emit').submit(function(event) {
                socket.emit('my event', {data: $('#emit_data').val()});
                return false;
            });
            $('form#broadcast').submit(function(event) {
                socket.emit('my broadcast event', {data: $('#broadcast_data').val(), user: username});
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

            //When an user clicked the fullscreen button.
            $('#videofullscreen').click(function(){
                var playerElement = document.getElementById("player");

                //Fullscreen support for most browsers.
                var requestFullScreen = playerElement.requestFullScreen || playerElement.msRequestFullscreen || playerElement.mozRequestFullScreen || playerElement.webkitRequestFullScreen;
                  if (requestFullScreen) {
                    requestFullScreen.bind(playerElement)();
                  }
            });

            $("#vidQualList.dropdown-menu.vidQualList").on("click", "li.vidQual",function(e) {
                console.log("Clicked Dropdown. " + $(this).text());

                //Set player quality to chosen button.
                player.setPlaybackQuality($(this).text());
            });

        });

function addYoutubeIframeAPI() {
    //This code loads the IFrame Player API code asynchronously.
     console.log("Loading youtube IFrame API.");
     var tag = document.createElement('script');
     tag.src = "https://www.youtube.com/iframe_api";
     var firstScriptTag = document.getElementsByTagName('script')[0];
     firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

//The API will call this function when the API has been loaded.
function onYouTubeIframeAPIReady() {
    console.log("Setting up youtube player.");
    player = new YT.Player('player', {
      height: '390',
      width: '640',
      videoId: 'vYuSRTDOa8c',
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
    console.log("Initializing getting current video etc.");
    if (connected) {
        $('#usernamesubmit').prop('disabled', false);
    }
    event.target.playVideo();
}

// API will call this function when the video player changes states.
function onPlayerStateChange(event) {
    //Empty all previous available qualities.
    $('.vidQualList').empty();

    //Loop through each available quality and add them to the settings list.
   var qualities = player.getAvailableQualityLevels();
    for(var x = 0; x < qualities.length; x++) {
        //Add new list item with content of the quality.
        $('.vidQualList').append("<li class='vidQual'>" + qualities[x] + "</li>");
    }
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

