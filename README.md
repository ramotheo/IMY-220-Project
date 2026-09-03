# IMY-220-Project
IMY 220 (Advanced Web Technologies) Project: Photo sharing website.


## RUN DOCKER ##

# 1. Build the Docker Image
    Navigate to the project folder:
        cd astrea

    Build the Docker Image:
        docker build -t astrea .

 # 2. Run the container and name it Astrea
    docker run -d --name Astrea -p 5173:5173 astrea

 # 3. Check that Astrea is running.
    docker ps

Once the container is running, open the application at:
    http://localhost:5173

 ## Useful Commands
    ** Stop Astrea Container **
        docker stop Astrea

    ** Start Astrea **
        docker start Astrea

    ** Restart Astrea **
    docker restart Astrea

    ** View Astrea Logs **
    docker logs Astrea

    ** Remove Astrea Container**
    docker rm -f Astrea