# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["TaskTrack.API/TaskTrack.API.csproj", "TaskTrack.API/"]
COPY ["TaskTrack.Service/TaskTrack.Service.csproj", "TaskTrack.Service/"]
COPY ["TaskTrack.Repo/TaskTrack.Repo.csproj", "TaskTrack.Repo/"]
RUN dotnet restore "TaskTrack.API/TaskTrack.API.csproj"

# Copy source code and build/publish
COPY . .
WORKDIR "/src/TaskTrack.API"
RUN dotnet publish "TaskTrack.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "TaskTrack.API.dll"]
