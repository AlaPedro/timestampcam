"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Photo {
  name: string;
  url: string;
  created_at: string;
}

interface GroupedPhotos {
  [key: string]: Photo[];
}

export default function PhotoFeed() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("dev-badalacam")
        .list();

      if (error) {
        console.error("Error fetching photos:", error);
        return;
      }

      const photoUrls = await Promise.all(
        data.map(async (file) => {
          const {
            data: { publicUrl },
          } = supabase.storage.from("dev-badalacam").getPublicUrl(file.name);

          return {
            name: file.name,
            url: publicUrl,
            created_at: file.created_at,
          };
        })
      );

      setPhotos(
        photoUrls.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupPhotosByDay = (photos: Photo[]): GroupedPhotos => {
    return photos.reduce((groups: GroupedPhotos, photo) => {
      const date = new Date(photo.created_at).toLocaleDateString("pt-BR");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(photo);
      return groups;
    }, {});
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  const groupedPhotos = groupPhotosByDay(photos);

  return (
    <div className="p-4">
      <Accordion type="single" collapsible className="w-full">
        {Object.entries(groupedPhotos).map(([date, photos]) => (
          <AccordionItem key={date} value={date}>
            <AccordionTrigger className="text-lg font-semibold text-zinc-200">
              {formatDateHeader(date)}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {photos.map((photo) => (
                  <div
                    key={photo.name}
                    className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800"
                  >
                    <span className="absolute top-2 right-2 bg-zinc-900 text-white px-2 py-1 text-xs z-10 flex rounded-md">
                      {formatDate(photo.created_at)}
                    </span>

                    <Image
                      src={photo.url}
                      alt={photo.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {photos.length === 0 && (
        <div className="text-center text-zinc-400 py-8">
          Nenhuma foto encontrada
        </div>
      )}
    </div>
  );
}
