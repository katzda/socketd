FROM ubuntu:20.04 as base

#temporarily install curl
RUN apt-get update && apt-get install -y curl;

# local timezone
RUN ln -snf /usr/share/zoneinfo/$(curl https://ipapi.co/timezone -s) /etc/localtime;

#remove curl
RUN apt-get remove -y curl;

# user
ARG HOST_UID
ARG HOST_GID
# change the developer user to appear with the same uid as host vm, Luke did this in dev image
RUN groupadd -g $HOST_GID developer; \
    useradd -u $HOST_UID -g $HOST_GID developer -m; \
    umask 002 \
    echo umask 002 >> /home/developer/.bashrc

#php 7.4
RUN apt-get update && apt-get install -y \
    php7.4 \
    php7.4-cli \
    php7.4-curl \
    php7.4-json \
    php7.4-mbstring \
    php7.4-opcache \
    php7.4-readline \
    php7.4-xml \
    php7.4-zip \
    php7.4-pgsql \
    php7.4-sqlite3 \
    php7.4-mbstring \
    php7.4-readline \
    php7.4-bcmath \
    php7.4-intl \
    php7.4-memcached \
    php7.4-imap \
    php7.4-msgpack \
    php7.4-gd;

RUN apt-get -y autoremove; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*;

USER root

###########################
# Dev environment         #
###########################

FROM base as dev

RUN apt-get update && apt-get install -y \
    curl nano vim unzip iputils-ping silversearcher-ag net-tools netcat php7.4-xdebug nodejs npm; \
    apt-get update; apt-get install -y \
    curl software-properties-common; \
    add-apt-repository ppa:ondrej/php;

# to be able to run npm run dev
RUN npm install --global cross-env;

RUN cd /home/developer; \
    php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    php -r "if (hash_file('sha384', 'composer-setup.php') === 'baf1608c33254d00611ac1705c1d9958c817a1a33bce370c0595974b342601bd80b92a3f46067da89e3b06bff421f182') \
            { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"; \
    php composer-setup.php --install-dir=/usr/local/bin --filename=composer; \
    php -r "unlink('composer-setup.php');";

RUN apt-get -y autoremove; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*;

ARG HOST_IP
RUN echo "zend_extension=/usr/lib/php/20190902/xdebug.so\n \
         xdebug.remote_enable=on\n \
         xdebug.remote_host=$HOST_IP\n \
         xdebug.remote_autostart=on \n \
         xdebug.remote_port=9901" > /etc/php/7.4/mods-available/xdebug.ini;

RUN chown -R developer /var/www;

USER developer
ARG URL
ARG REPO_DIR_IN_DOCKER
RUN mkdir $REPO_DIR_IN_DOCKER

WORKDIR $REPO_DIR_IN_DOCKER

#####################################################
# BUILD                                             #
# from dev just so we can run composer install, etc #
#####################################################
FROM dev as build
ARG APP_NAME
ARG SSH_PRIVATE_KEY

# to be able to run git clone
RUN apt-get update && apt-get install -y \
    git ssh;

USER developer
RUN mkdir ~/.ssh; \
    echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa; \
    chmod 600 ~/.ssh/id_rsa; \
    touch ~/.ssh/known_hosts; \
    ssh-keyscan github.com >> ~/.ssh/known_hosts;

ARG CACHEBUST=1
RUN cd ~; \
    git clone git@github.com:katzda/$APP_NAME.git app; \
    cd app/web; \
    cp ~/.env .; \
    composer install --no-ansi --no-dev --no-interaction --no-progress --no-scripts --optimize-autoloader;

RUN cd ~/app/web; \
    npm install --production \
    npm run prod;

########
# PROD #
########
FROM base as prod

ARG URL

USER developer
COPY --from=build /home/developer/app/web /var/www/$URL

USER root
RUN chown -R root storage bootstrap/cache; \
    find . -type d -exec chmod 555 -- {} +; \
    # these are restrected only because it otherwise takes forever. But I could enable it for prod but maybe not for QA
    find . -not -path "*/node_modules/*" -not -path "*/vendor/*" -type f -exec chmod 444 -- {} +; \
    find storage -type f -exec chmod 664 -- {} +; \
    find storage -type d -exec chmod 775 -- {} +; \
    find bootstrap/cache -type f -exec chmod 664 -- {} +; \
    find bootstrap/cache -type d -exec chmod 775 -- {} +;
