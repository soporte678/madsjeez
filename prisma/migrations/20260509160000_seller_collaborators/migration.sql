CREATE TYPE "SellerCollaboratorInviteStatus" AS ENUM ('PENDING', 'REVOKED');

CREATE TABLE "seller_collaborator_invites" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "token" TEXT NOT NULL,
    "status" "SellerCollaboratorInviteStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seller_collaborator_invites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seller_collaborators" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "member_user_id" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "seller_collaborators_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "seller_collaborator_invites_token_key" ON "seller_collaborator_invites"("token");
CREATE INDEX "seller_collaborator_invites_owner_user_id_idx" ON "seller_collaborator_invites"("owner_user_id");
CREATE INDEX "seller_collaborator_invites_owner_user_id_email_idx" ON "seller_collaborator_invites"("owner_user_id", "email");

CREATE UNIQUE INDEX "seller_collaborators_owner_user_id_member_user_id_key" ON "seller_collaborators"("owner_user_id", "member_user_id");
CREATE INDEX "seller_collaborators_member_user_id_idx" ON "seller_collaborators"("member_user_id");

ALTER TABLE "seller_collaborator_invites" ADD CONSTRAINT "seller_collaborator_invites_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seller_collaborators" ADD CONSTRAINT "seller_collaborators_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seller_collaborators" ADD CONSTRAINT "seller_collaborators_member_user_id_fkey" FOREIGN KEY ("member_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
