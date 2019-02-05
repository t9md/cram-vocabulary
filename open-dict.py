from wsgiref.simple_server import make_server
import os

def simple_app(environ, start_response):
    status = '200 OK'
    headers = [
        ('Content-type', 'text/plain'),
        ('Access-Control-Allow-Origin', '*')
    ]
    start_response(status, headers)

    word = environ['PATH_INFO'][1:]
    os.system('open dict://' + word)
    os.system("osascript -e 'activate application \"Google Chrome\"'")
    return ''

httpd = make_server('', 8000, simple_app)
print "Serving on port 8000..."
httpd.serve_forever()
