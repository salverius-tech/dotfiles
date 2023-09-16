!/bin/bash
if [ ! -d "/app/.repos/nxs-homelab-ansible" ] ; then
  git clone ssh://git@172.30.40.51:2222/salverius/nxs-homelab-ansible.git /app/.repos/nxs-homelab-ansible
else
  git pull --quiet --rebase --autostash
fi