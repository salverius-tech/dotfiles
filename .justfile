
addrepositories:
	sudo apk add --repository ppa:rmescandon/yq
	sudo apk update

addpackage-pip: addrepositories
	curl -sSL https://bootstrap.pypa.io/get-pip.py -o get-pip.py
	sudo python3 get-pip.py
	rm get-pip.py

addpackage-yamllint: addpackage-pip
	sudo pip install --root-user-action=ignore yamllint

install-dependencies: addpackage-yamllint

initialize-localhost: install-dependencies
	ansible-playbook ./playbooks/initialize-localhost.yml -b

check-syntax:
	ansible-playbook ./playbooks/initialize-localhost.yml --syntax-check

show-env:
	@env | sort