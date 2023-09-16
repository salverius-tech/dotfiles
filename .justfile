initialize-localhost:
	ansible-playbook ./playbooks/initialize-localhost.yml -b

check-syntax:
	ansible-playbook ./playbooks/initialize-localhost.yml --syntax-check