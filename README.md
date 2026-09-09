# 7MATA Mobility Operating System

A compliance-first mobility operating system designed for
regulated passenger mobility.

## Core model

Actor -> Capability -> Action -> Event -> State -> Evidence

## Backend

- Node.js 22
- TypeScript
- pnpm
- Fastify
- PostgreSQL
- Drizzle ORM
- Redis
- BullMQ
- Zod
- Vitest

## Architecture

This repository is intentionally a modular monolith.

Modules are separated by business capability so they can
later be extracted into independent services if scale
requires it.

## Important

The regulatory profile is NOT considered legally complete
until every executable requirement has been verified
against authoritative sources.
