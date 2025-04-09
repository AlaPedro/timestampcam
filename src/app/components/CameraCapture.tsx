"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { FaCamera, FaDownload, FaStop } from "react-icons/fa";
import { FaPlay } from "react-icons/fa";
export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Inicia a câmera
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
    }
  };

  // Tira a foto
  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Ajusta o canvas para o tamanho do vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenha o frame do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Adiciona timestamp (data e hora)
    const timestamp = new Date().toLocaleString();
    const appName = "BadalaCam";

    // Função para desenhar retângulo com cantos arredondados
    const drawRoundedRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      context.beginPath();
      context.moveTo(x + radius, y);
      context.lineTo(x + width - radius, y);
      context.quadraticCurveTo(x + width, y, x + width, y + radius);
      context.lineTo(x + width, y + height - radius);
      context.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      );
      context.lineTo(x + radius, y + height);
      context.quadraticCurveTo(x, y + height, x, y + height - radius);
      context.lineTo(x, y + radius);
      context.quadraticCurveTo(x, y, x + radius, y);
      context.closePath();
      context.fill();
    };

    // Configuração do texto do timestamp (topo)
    context.font = "bold 32px Arial";
    const textWidth = context.measureText(timestamp).width;
    const paddingX = 20; // Aumentado padding horizontal
    const radius = 8; // Raio para cantos arredondados

    // Fundo preto para o timestamp (topo)
    context.fillStyle = "black";
    drawRoundedRect(5, 5, textWidth + paddingX * 2, 40, radius);

    // Texto do timestamp
    context.fillStyle = "white";
    context.fillText(timestamp, 5 + paddingX, 35);

    // Configuração do texto do BadalaCam (parte inferior)
    context.font = "bold 24px Arial";
    const appNameWidth = context.measureText(appName).width;
    const bottomPadding = 20;
    const appNameHeight = 35;
    const bottomY = canvas.height - appNameHeight - bottomPadding;

    // Fundo preto para o BadalaCam
    context.fillStyle = "black";
    drawRoundedRect(
      5,
      bottomY,
      appNameWidth + paddingX * 2,
      appNameHeight,
      radius
    );

    // Texto do BadalaCam
    context.fillStyle = "white";
    context.fillText(appName, 5 + paddingX, bottomY + 25);

    // Converte para URL de imagem e armazena
    const photoUrl = canvas.toDataURL("image/jpeg");
    setPhoto(photoUrl);
    stopCamera();
    setIsCameraActive(false);
  };

  // Para a câmera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Download da foto
  const downloadPhoto = () => {
    if (!photo) return;

    const link = document.createElement("a");
    link.download = `foto-${new Date().toISOString()}.jpg`;
    link.href = photo;
    link.click();
  };

  return (
    <div className="flex flex-col gap-4 items-center justify-center px-4">
      {!isCameraActive && (
        <span className="text-zinc-800 font-bold text-lg">
          Inicie a câmera para registrar o horário
        </span>
      )}

      {/* Vídeo da câmera */}
      {isCameraActive && (
        <video ref={videoRef} autoPlay playsInline muted></video>
      )}

      {/* Canvas para captura */}
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

      {/* Botões */}
      <div className="flex flex-col gap-4">
        {isCameraActive ? (
          <button
            className="bg-zinc-900 text-zinc-50 p-2 rounded-md flex items-center gap-2 justify-center"
            onClick={stopCamera}
          >
            <FaStop />
            Parar Câmera
          </button>
        ) : (
          <button
            className="bg-zinc-900 text-zinc-50 p-2 rounded-md flex items-center gap-2 justify-center"
            onClick={startCamera}
          >
            <FaPlay />
            Iniciar Câmera
          </button>
        )}
        <button
          className="bg-zinc-900 text-zinc-50 p-2 rounded-md flex items-center gap-2 justify-center"
          onClick={takePhoto}
          disabled={!stream}
        >
          <FaCamera />
          Tirar Foto
        </button>

        {photo && (
          <>
            <div className="flex flex-col gap-4 px-4">
              <h3>Prévia:</h3>
              <Image
                src={photo}
                alt="Foto capturada"
                width={400}
                height={300}
                style={{ maxWidth: "100%" }}
              />
              <button
                className="bg-zinc-900 text-zinc-50 p-2 rounded-md flex items-center gap-2 justify-center hover:bg-zinc-800"
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
