#/bin/bash

if (whoami != root)
	then echo "Please run as root"
	exit
fi

sudo rm -rf /www/data/movies
mkdir /www/data/movies
mkdir /www/data/movies/scripts
mkdir /www/data/movies/css
sudo cp -v ./*.html /www/data/movies
sudo cp -v ./scripts/*.js /www/data/movies/scripts
sudo cp -v ./css/*.css /www/data/movies/css
find /www/data/movies -type f -print0 | xargs -0 chmod 644
sudo chown -R root:root /www/data/movies
echo "Complete"
