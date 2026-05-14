FROM node:20-alpine

WORKDIR /app

# Build-time env vars — must be set BEFORE `npm run build` so NEXT_PUBLIC_*
# values get inlined into the client bundle.
ARG NEXT_PUBLIC_MAIN_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_MAIN_APP_URL=$NEXT_PUBLIC_MAIN_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
