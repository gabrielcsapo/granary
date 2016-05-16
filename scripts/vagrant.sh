echo '\n Installing Redis \n'
sudo apt-get -y install redis-server;

echo '\n Updating base box \n'
sudo apt-get -y update;
sudo apt-get -y install build-essential libssl-dev;
sudo apt-get install git;

echo '\n Installing nvm \n'
curl https://raw.githubusercontent.com/creationix/nvm/v0.16.1/install.sh | sh;
source ~/.profile;

nvm install 4;
npm install npm@3;

echo '\n Installing Mongodb \n'

sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb http://repo.mongodb.org/apt/ubuntu precise/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
sudo apt-get update
sudo apt-get install -y mongodb-org
