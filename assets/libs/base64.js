 "use strict";

$(function() {

  (function() {

    function b64DecodeUnicode(str) {
      return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    }

    var b64lastElement = null;

    function b64DecodeUserFriendly(str) {
      if (b64lastElement) {
        b64lastElement.remove();
        b64lastElement = null;
      }
      try {
        return b64DecodeUnicode(str);
      } catch (err) {
        b64lastElement = 
          $("<div class='alert alert-warning'>" +
          "<strong>Warning!</strong> base64 parse problem</div>"
        ).appendTo(".user-errors-here");
        throw err;
      }
    }

    var parseId, cacheInput, cacheArgs;

    function parse() {
      if (parseId) {
        clearTimeout(parseId);
      }

      parseId = setTimeout(function () {
        var input = b64DecodeUserFriendly($("#sed-base64-stdin").val()),
            args = $("#sed-cmd").val();
        if (cacheInput !== input || cacheArgs !== args){
          cacheInput = input;
          cacheArgs = args;
          $("#sed-stdin").val(input);
          $("#sed-stdout").val(fn_gnu_sed(input, args).replace(/\n$/, ""));
        }
      }, 333);
    }

    $("#sed-base64-stdin").on('keyup input', parse);
    $("#sed-cmd").on('keyup input', parse);

  })();

  /* options */

  (function() {
    $(".sed-options.dropdown-menu li a").click(function() {
      var val = $(this).text();
      var newVal = ['--help', '--version'].indexOf(val) > -1 
        ? val
        : val + ' ' + $("#sed-cmd").val();
      $("#sed-cmd").val(newVal).keyup();
    });
  })();

  /* Gist API */

  (function() {
    $("li a.gist-api").click(function() {
      var formData = new FormData();
      formData.append("file",  new File([$("#sed-base64-stdin").val()], 'base64stdin', {type: 'text/plain'}));
      formData.append("file",  new File([$("#sed-stdin").val()], 'stdin', {type: 'text/plain'}));
      formData.append("file",  new File([$("#sed-stdout").val()], 'stdout', {type: 'text/plain'}));
      formData.append("file",  new File([$("#sed-cmd").val()], 'cmd', {type: 'text/plain'}));
      formData.append('title', 'base64sed.js');
      $.ajax({
        cache: false,
        contentType: false,
        processData: false,
        type: "POST",
        url: 'https://api.bitbucket.org/2.0/snippets/sedjs',
        headers: {
          'Authorization': 'Basic bWF6a29ib3Q6QVRCQnNRblEzejU0Qks1QUJlUXQ0ejJYVU5hRzIxNjhBNTlC'
        },
        data: formData,
      }).done(function(response) {
        var url = response.links.html.href,
            my = $(location).attr('href').replace(/(#|\?).*$/, "") + '?snippet=' + response.id;
        $(".user-errors-here").append( "<div class='alert alert-success alert-dismissible fade in' role=alert>" + 
          "<button type=button class=close data-dismiss=alert aria-label=Close><span aria-hidden=true>&times;</span></button>" + 
          "<strong>Snippet:</strong> <a href='" + url + "'>" + response.id + "</a> | " + 
          "<strong>Share:</strong> <a href='" + my + "'>me</a>" + 
          "</div>"
        );
      }).fail(function( e ) {
        $(".user-errors-here").append( "<div class='alert alert-danger alert-dismissible fade in' role=alert>" + 
          "<button type=button class=close data-dismiss=alert aria-label=Close><span aria-hidden=true>&times;</span></button>" + 
          "<strong>Holy guacamole!</strong> " + [e.status, e.statusText] + "</div>"
        );
      });
    });
  })();

});

/* Gist load or default */

(function() {
  var params    = new URLSearchParams(window.location.search),
      gistId    = params.get('gist'),
      snippetId = params.get('snippet') || 'Lz666p',
      doc_ready = $.Deferred();

  /* http://stackoverflow.com/q/10326398 */

  $(doc_ready.resolve);

  if (gistId) {
    var content = $.when(
      $.get( 'https://api.github.com/gists/' + gistId),
      doc_ready )
    .then(function( data ) {
      try { return { args: data[0].files.args.content, stdin: data[0].files.stdin.content }; }
      catch(e) { return $.Deferred().reject({ statusText: 'invalid gist format', status: -1 }); }
    });
  } else {
    var content = $.when(
      $.get( 'https://api.bitbucket.org/2.0/snippets/sedjs/' + snippetId + '/files/cmd'),
      $.get( 'https://api.bitbucket.org/2.0/snippets/sedjs/' + snippetId + '/files/base64stdin'),
      doc_ready )
    .then(function( data_args, data_stdin ) {
      return { args: data_args[0], stdin: data_stdin[0] };
    });
  }

  content.then(function( data ) {
      var args  = data.args,
          rows  = args.split(/\r\n|\r|\n/).length,
          stdin = data.stdin;
      $("#sed-cmd").val(args).attr("rows", rows).css({"height": rows > 1 ? "auto" : "34px"});
      // document.ready() callbacks are called in the order they were registered.
      // If you register your testing callback first, it will be called first
      // keyup() listener is registered earlier in this file
      $("#sed-base64-stdin").val(stdin).keyup();
    })
    .fail(function( e ) {
      $(".user-errors-here").append( "<div class='alert alert-danger alert-dismissible fade in' role=alert>" +
        "<button type=button class=close data-dismiss=alert aria-label=Close><span aria-hidden=true>&times;</span></button>" +
        "<strong>Holy guacamole!</strong> " + [e.status, e.statusText] + "</div>"
      );
    });

})();
