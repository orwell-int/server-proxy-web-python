env/bin/activate:
	virtualenv -p python3 env
	. env/bin/activate && pip install -r requirements.txt && pip install -e .

develop: env/bin/activate

test: env/bin/activate
	. env/bin/activate && nosetests

coverage: env/bin/activate
	. env/bin/activate && nosetests --with-coverage --cover-package=orwell --cover-tests

clean: env/bin/activate
	. env/bin/activate && coverage erase
