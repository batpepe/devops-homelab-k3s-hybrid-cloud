FROM nginx:stable-alpine
RUN apk upgrade --no-cache
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY CV_Kostiantyn_Osmakov.pdf /usr/share/nginx/html/
EXPOSE 80
