-- OAuth Zipnova Envíos por vendedor (marketplace multi-cuenta)

CREATE TABLE "seller_zipnova_oauth" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,
    "zipnova_account_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_zipnova_oauth_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "seller_zipnova_oauth_user_id_key" ON "seller_zipnova_oauth"("user_id");

ALTER TABLE "seller_zipnova_oauth" ADD CONSTRAINT "seller_zipnova_oauth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
