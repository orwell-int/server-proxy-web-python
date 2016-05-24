env/bin/activate:
	virtualenv -p python env
	. env/bin/activate && pip install -r requirements.txt && pip install -e .

develop: env/bin/activate
	git submodule update --init
	cd messages
	./generate.sh
	cd ../orwell
	ln -s ../messages/orwell/messages .

test: env/bin/activate
	. env/bin/activate && nosetests

coverage: env/bin/activate
	. env/bin/activate && nosetests --with-coverage --cover-package=orwell --cover-tests

clean: env/bin/activate
	. env/bin/activate && coverage erase

start: env/bin/activate
	. env/bin/activate && python orwell/proxy/main.py
