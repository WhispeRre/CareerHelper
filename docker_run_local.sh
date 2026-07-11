docker rm -f careerhelper

docker rmi liuzeyu03/careerhelper:latest

docker run -d --name careerhelper --platform linux/amd64 -p 3003:3000 -e AUTH_SECRET=l/UrZGNHj5a7EK4Uw6zu8/sBWxkRE6RcGRweGAX1Z5U= -v ./careerhelper-data:/app/data liuzeyu03/careerhelper:latest
