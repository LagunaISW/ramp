import type { CreditCard } from "@prisma/client";

import { prisma } from "~/db.server";

export type { CreditCard } from "@prisma/client";

export function getCreditCard({
  id,
}: Pick<CreditCard, "id">) {
  return prisma.creditCard.findFirst({
    where: { id },
  });
}

function isStatus(status?: string) {
  if (!status) return false;

  return status === "confirmed" || status === "declined" || status === "pending";
}

export function getCreditCardListItems(filter?: string) {
  if (isStatus(filter)) {
    return prisma.creditCard.findMany({ where: { status: filter }, orderBy: { name: "asc" } })
  }

  return prisma.creditCard.findMany({ orderBy: { name: "asc" } });
}

export function createCreditCard({
  number,
  provider,
  cvv,
  pin,
  expirationDate,
  clientId,
}: Pick<CreditCard, "number" | "provider" | "cvv" | "pin" | "expirationDate" | "clientId">) {
  let data = {
    number,
    provider,
    cvv,
    pin,
    expirationDate,
    clientId,
  };

  return prisma.creditCard.create({
    data: data,
  });
}

export function updateCreditCard({
  id,
  number,
  provider,
  cvv,
  pin,
  expirationDate,
  clientId,
}: Pick<CreditCard, "id" | "number" | "provider" | "cvv" | "pin" | "expirationDate" | "clientId">) {
  let data = {
    number,
    provider,
    cvv,
    pin,
    expirationDate,
    clientId,
  };

  return prisma.creditCard.updateMany({
    where: { id },
    data: data,
  });
}

export function deleteCreditCard({
  id,
}: Pick<CreditCard, "id">) {
  return prisma.creditCard.deleteMany({
    where: { id },
  });
}
