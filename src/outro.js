
// Expose IO to the global object or as AMD module
if (typeof define === 'function' && define.amd) {
    define('IO', [], function() { return IO } )
} else {
    window.IO = IO
}

}(this);
