# Dashboard — Docker

This project can be run using Docker and Docker Compose.

Docker allows you to run the frontend and backend in isolated containers without having to install all dependencies directly on your machine.

## Prerequisites

You need to have Docker installed.

Check that Docker is available:

```bash
docker --version
```

Check Docker Compose:

```bash
docker compose version
```

If both commands return a version, Docker is ready to use.

---

# Project structure

The project contains:

```text
Dashboard/
├── frontend/
├── backend/
├── docker-compose.yml
└── README.md
```

Each part of the application can be run in its own Docker container.

---

# Starting the project

From the root of the project:

```bash
docker compose up
```

Docker Compose will:

1. Build the required images if they do not already exist.
2. Create the containers.
3. Start the frontend and backend.
4. Display the logs directly in the terminal.

To start the containers in the background:

```bash
docker compose up -d
```

The `-d` option means **detached mode**. The containers continue running while you can use your terminal normally.

---

# Building the project

To build the Docker images:

```bash
docker compose build
```

You can also build and start the project at the same time:

```bash
docker compose up --build
```

This is useful after changing a `Dockerfile` or dependencies.

For example:

```bash
docker compose up --build -d
```

builds the images and starts the containers in the background.

---

# Stopping the project

To stop the running containers:

```bash
docker compose down
```

This stops and removes the containers created by Docker Compose.

It does **not** delete your source code.

---

# Viewing running containers

To see the containers currently running:

```bash
docker compose ps
```

You can also use:

```bash
docker ps
```

---

# Viewing logs

To see the logs of all services:

```bash
docker compose logs
```

To follow the logs in real time:

```bash
docker compose logs -f
```

To see the logs of only one service:

```bash
docker compose logs -f backend
```

or:

```bash
docker compose logs -f frontend
```

The exact service names depend on the `docker-compose.yml` file.

---

# Rebuilding after changes

If you modify the source code and the project uses Docker volumes for development, the changes may be detected automatically.

If you modify dependencies or a `Dockerfile`, rebuild the containers:

```bash
docker compose up --build
```

If you want to completely recreate the containers:

```bash
docker compose down
docker compose up --build
```

---

# Opening a shell inside a container

You can open a shell inside a running container with:

```bash
docker compose exec backend sh
```

For the frontend:

```bash
docker compose exec frontend sh
```

Depending on the image, `bash` may be available instead:

```bash
docker compose exec backend bash
```

Once inside the container, commands are executed inside the Docker environment rather than directly on your computer.

To leave the container:

```bash
exit
```

---

# Useful Docker commands

## List all containers

```bash
docker ps -a
```

## List Docker images

```bash
docker images
```

## Remove unused containers

```bash
docker container prune
```

## Remove unused images

```bash
docker image prune
```

Be careful with cleanup commands because they remove Docker resources that are no longer being used.

---

# Docker Compose commands summary

| Command                           | Description                  |
| --------------------------------- | ---------------------------- |
| `docker compose up`               | Start the project            |
| `docker compose up -d`            | Start in background          |
| `docker compose up --build`       | Rebuild and start            |
| `docker compose build`            | Build the images             |
| `docker compose down`             | Stop and remove containers   |
| `docker compose ps`               | Show project containers      |
| `docker compose logs`             | Show logs                    |
| `docker compose logs -f`          | Follow logs                  |
| `docker compose exec backend sh`  | Open a shell in the backend  |
| `docker compose exec frontend sh` | Open a shell in the frontend |

---

# Typical workflow

When starting work on the project:

```bash
docker compose up -d
```

Check that everything is running:

```bash
docker compose ps
```

If something goes wrong, check the logs:

```bash
docker compose logs -f
```

When you finish:

```bash
docker compose down
```

If you changed dependencies or Docker configuration:

```bash
docker compose down
docker compose up --build -d
```

---

# Troubleshooting

## Docker permission denied

If Docker gives a permission error such as:

```text
permission denied while trying to connect to the Docker daemon
```

make sure Docker is running.

You can check:

```bash
sudo systemctl status docker
```

If necessary:

```bash
sudo systemctl start docker
```

On Linux, you can also add your user to the Docker group:

```bash
sudo usermod -aG docker $USER
```

Then log out and log back in for the change to take effect.

---

## Port already in use

If Docker reports an error such as:

```text
bind: address already in use
```

another application is already using the required port.

You can find which process is using a port with:

```bash
sudo lsof -i :8080
```

Replace `8080` with the port causing the problem.

You can then stop the application using that port or change the port mapping in `docker-compose.yml`.

---

## Container keeps restarting

Check the logs:

```bash
docker compose logs backend
```

or:

```bash
docker compose logs frontend
```

The logs usually indicate why the application failed to start.

---

# Important

Do not normally use:

```bash
sudo npm install
```

inside the project.

Docker containers have their own dependencies and environment. Install project dependencies according to the project's Docker configuration rather than changing ownership of project files unnecessarily.

For normal development, Docker Compose should be the main entry point for starting the application.

## Quick start

For most users, the entire project can be started with:

```bash
docker compose up --build -d
```

Then check the containers:

```bash
docker compose ps
```

And view the logs if necessary:

```bash
docker compose logs -f
```

To stop everything:

```bash
docker compose down
```
