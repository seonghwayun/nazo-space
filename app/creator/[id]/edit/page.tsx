import mongoose from "mongoose";
import { notFound } from "next/navigation";
import connectToDatabase from "@/lib/db";
import Creator from "@/models/creator";
import { EditCreatorClient } from "./client";

interface EditCreatorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCreatorPage({ params }: EditCreatorPageProps) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();

  await connectToDatabase();
  const creator = await Creator.findById(id).select("name url").lean();
  if (!creator) notFound();

  return <EditCreatorClient id={id} name={creator.name} url={creator.url || ""} />;
}
