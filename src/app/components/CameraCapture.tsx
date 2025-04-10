"use client";

import { useRef, useState, useEffect } from "react";
import { FaDownload, FaCamera, FaSync, FaEye } from "react-icons/fa";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textOverlayRef = useRef<HTMLDivElement>(null); // Referência para a div do texto
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(""); // Timestamp atualizado
  const [isClient, setIsClient] = useState(false); // Flag to track if we're on client side
  const [cameraError, setCameraError] = useState<string | null>(null); // Para mostrar erros da câmera

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
    // Set initial time
    setCurrentTime(new Date().toLocaleString());
  }, []);

  // Atualiza o timestamp a cada segundo (only on client side)
  useEffect(() => {
    if (!isClient) return;

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, [isClient]);

  // Inicia a câmera
  const startCamera = async () => {
    // Se houver uma foto capturada anteriormente, recarrega a página
    if (capturedImage) {
      window.location.reload();
      return;
    }

    setIsCameraActive(true);
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: useFrontCamera ? "user" : "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false, // Não precisamos de áudio para fotos
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
      setCameraError(
        "Não foi possível acessar a câmera. Verifique as permissões."
      );
    }
  };

  // Alterna entre câmeras
  const toggleCamera = () => {
    setUseFrontCamera(!useFrontCamera);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      startCamera();
    }
  };

  // Captura uma foto
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setCameraError("Não foi possível obter o contexto do canvas");
      return;
    }

    // Configurar o canvas com as dimensões do vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar o frame atual no canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Adicionar texto (mesmo estilo da foto)
    const timestamp = new Date().toLocaleString();
    const appName = "BadalaCam";

    // Configuração do texto do timestamp (topo)
    ctx.font = "bold 32px Arial";
    const textWidth = ctx.measureText(timestamp).width;
    const paddingX = 20;
    const radius = 8;

    // Função para desenhar retângulo com cantos arredondados
    const drawRoundedRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      );
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
    };

    // Fundo preto para o timestamp (topo)
    ctx.fillStyle = "black";
    drawRoundedRect(5, 5, textWidth + paddingX * 2, 40, radius);

    // Texto do timestamp
    ctx.fillStyle = "white";
    ctx.fillText(timestamp, 5 + paddingX, 35);

    // Configuração do texto do BadalaCam (parte inferior)
    ctx.font = "bold 24px Arial";
    const appNameWidth = ctx.measureText(appName).width;
    const bottomPadding = 20;
    const appNameHeight = 35;
    const bottomY = canvas.height - appNameHeight - bottomPadding;

    // Fundo preto para o BadalaCam
    ctx.fillStyle = "black";
    drawRoundedRect(
      5,
      bottomY,
      appNameWidth + paddingX * 2,
      appNameHeight,
      radius
    );

    // Texto do BadalaCam
    ctx.fillStyle = "white";
    ctx.fillText(appName, 5 + paddingX, bottomY + 25);

    // Converter o canvas para uma imagem
    const imageUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageUrl);

    // Desativa a câmera após capturar a foto
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const uploadPhoto = async (file: Blob, fileName: string) => {
    const fileExt = fileName.split(".").pop();
    const newFileName = `${Math.random()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("badalacam") // nome do seu bucket
      .upload(newFileName, file);

    if (error) {
      console.error("Erro no upload:", error);
      return null;
    }

    // Retorna URL pública da imagem
    const {
      data: { publicUrl },
    } = supabase.storage.from("badalacam").getPublicUrl(data.path);

    return publicUrl;
  };

  // Download da foto
  const downloadPhoto = async () => {
    if (!capturedImage) return;
    const link = document.createElement("a");
    // Converte data URL para Blob
    const blob = await fetch(capturedImage).then((res) => res.blob());
    const fileName = `foto-${new Date().toISOString()}.jpg`;

    // Faz o upload para o Supabase
    await uploadPhoto(blob, fileName);

    // Faz o download direto da imagem
    link.download = fileName;
    link.href = capturedImage;
    link.click();
  };

  // Para a câmera ao sair do componente
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="flex flex-col gap-4 items-center justify-center px-4">
      {/* Container da câmera com texto sobreposto */}
      {isCameraActive && (
        <div className="relative w-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              borderRadius: "10px",
              boxShadow: "0 10px 10px 0 rgba(0, 0, 0, 0.3)",
              transform: useFrontCamera ? "scaleX(-1)" : "none", // Inverte a câmera frontal
            }}
          ></video>

          {/* Texto sobreposto */}
          <div
            ref={textOverlayRef}
            className="absolute bottom-5 left-3 text-white bg-black bg-opacity-50 p-2 text-base font-bold rounded"
          >
            {currentTime}
          </div>
        </div>
      )}

      {/* Canvas para captura (escondido) */}
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

      {/* Mensagem de erro */}
      {cameraError && (
        <div className="text-red-600 font-bold text-xl p-2 bg-red-100 rounded">
          {cameraError}
        </div>
      )}

      {/* Botões */}
      <div className="flex flex-col gap-4 w-full">
        {!isCameraActive && (
          <div className="flex  gap-4">
            <button
              className="bg-blue-900 text-zinc-50 p-2 px-4 rounded-md flex items-center gap-2 justify-center mt-4 h-20"
              onClick={startCamera}
            >
              <FaCamera />
              Iniciar Câmera
            </button>
            <Link href="/feed">
              <button className="bg-emerald-900 text-zinc-50 p-2 px-4 rounded-md flex items-center gap-2 justify-center mt-4 h-20">
                <FaEye />
                Ver Feed
              </button>
            </Link>
          </div>
        )}

        {isCameraActive && (
          <button
            className="bg-blue-900 text-zinc-50 p-2 rounded-md flex items-center gap-2 justify-center h-20"
            onClick={toggleCamera}
          >
            <FaSync />
            Alternar para {useFrontCamera ? "Traseira" : "Frontal"}
          </button>
        )}

        {isCameraActive && (
          <button
            className="bg-emerald-900 h-20 w-full text-zinc-50 p-2 rounded-md flex items-center gap-2 justify-center"
            onClick={capturePhoto}
          >
            <FaCamera />
            Tirar Foto
          </button>
        )}

        {capturedImage && (
          <>
            <div className="flex flex-col gap-4 px-4">
              <h3>Prévia da Foto:</h3>
              <img
                src={capturedImage}
                alt="Foto capturada"
                style={{ width: "100%", borderRadius: "10px" }}
              />
              <button
                className="bg-emerald-900 text-zinc-50 p-2 rounded-md flex items-center gap-2 justify-center hover:bg-zinc-800 mb-20 h-20"
                onClick={downloadPhoto}
              >
                <FaDownload />
                Baixar Foto
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
