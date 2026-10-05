# Stage 1: Build (.NET 10)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["QE190010_PRN232_Ass1_BE/TaskTrack.API/TaskTrack.API.csproj", "QE190010_PRN232_Ass1_BE/TaskTrack.API/"]
COPY ["QE190010_PRN232_Ass1_BE/TaskTrack.Service/TaskTrack.Service.csproj", "QE190010_PRN232_Ass1_BE/TaskTrack.Service/"]
COPY ["QE190010_PRN232_Ass1_BE/TaskTrack.Repo/TaskTrack.Repo.csproj", "QE190010_PRN232_Ass1_BE/TaskTrack.Repo/"]
RUN dotnet restore "QE190010_PRN232_Ass1_BE/TaskTrack.API/TaskTrack.API.csproj"

# Copy source code and build/publish
COPY QE190010_PRN232_Ass1_BE/ QE190010_PRN232_Ass1_BE/
WORKDIR "/src/QE190010_PRN232_Ass1_BE/TaskTrack.API"
RUN dotnet publish "TaskTrack.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "TaskTrack.API.dll"]
