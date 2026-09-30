# Multi-stage build for ASP.NET Core 8 Web API
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj files and restore dependencies
COPY src/backend/src/TaskFlow.Domain/TaskFlow.Domain.csproj src/backend/src/TaskFlow.Domain/
COPY src/backend/src/TaskFlow.Application/TaskFlow.Application.csproj src/backend/src/TaskFlow.Application/
COPY src/backend/src/TaskFlow.Infrastructure/TaskFlow.Infrastructure.csproj src/backend/src/TaskFlow.Infrastructure/
COPY src/backend/src/TaskFlow.Api/TaskFlow.Api.csproj src/backend/src/TaskFlow.Api/

RUN dotnet restore src/backend/src/TaskFlow.Api/TaskFlow.Api.csproj

# Copy all source files and publish
COPY src/backend/src/ src/backend/src/
RUN dotnet publish src/backend/src/TaskFlow.Api/TaskFlow.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=8080
EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "TaskFlow.Api.dll"]
