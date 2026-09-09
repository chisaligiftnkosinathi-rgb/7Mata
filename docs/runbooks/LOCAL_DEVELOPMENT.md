# Local Development

## Start infrastructure

`docker compose up -d`

## Install dependencies

`pnpm install`

## Generate migrations

`pnpm db:generate`

## Run migrations

`pnpm db:migrate`

## Start API

`pnpm --filter @7mata/api dev`

Health:

`http://localhost:3000/health`
