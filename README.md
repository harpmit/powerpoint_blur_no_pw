This is a template for distributing python code via a web app

The html and javascript create a browser GUI where a file can be uploaded and made available to "pyodide", which is a version of the python interpretter that is compiled using web assembly to work in the browser.

The python code can then arbirtrarily manipulate the file, save it (in a vitrual file tree that is created by emscripten), and pass the name of the new file(s) back to the browser. This new file is then downloaded.

Raw python code is in the "python_code" folder and the top level "python code.py" script should contain a function called js_entry_point(). That function should take a single argument (the path to the file to manipulate), and return a list of paths to new files for the browser to download.

The python code needs to be built as a ".whl" file for the browser to read it. This is accomplished by navigating to the "python_code" directory and running "python -m build". It may be necessary to run "pip install build" for this to work.

Dependencies can get complicated when running files in the browser. For pure-python dependencies, it should be sufficient to include them in the "pyproject.toml" file. These will be included in the ".whl" file and available in the broswer environment. For python packages that include C bindings (e.g. numpy, pandas, etc.), a specifically built .whl file is necessary. Many of these are available from the pyodide website (and several are copied to the "pyodide" folder of this directory). To make these dependencies available to the python script, they need to be installed using micropip in "index.js".