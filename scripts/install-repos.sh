#!/bin/bash
if [ ! -d "/app/.repos/nxs-homelab-ansible/.git" ] ; then
  git clone -f ssh://git@172.30.40.51:2222/salverius/nxs-homelab-ansible.git /app/.repos/nxs-homelab-ansible
else
  cd /app/.repos/nxs-homelab-ansible
  git pull --quiet --rebase --autostash
fi

if [ ! -d "/app/.repos/upgraded-barnacle" ] ; then
    git clone -f git@github.com:salverius-tech/upgraded-barnacle.git /app/.repos/upgraded-barnacle
else
  cd /app/.repos/upgraded-barnacle
  git pull --quiet --rebase --autostash
fi