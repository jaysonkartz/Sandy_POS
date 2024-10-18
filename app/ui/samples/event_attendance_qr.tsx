"use client";
import { Input } from "@nextui-org/react";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QRCodeGenerator() {
  const [input, setInput] = useState(
    "https://project-bob-derrik.vercel.app/dashboard/samples",
  );

  return (
    <div className="flex flex-col gap-2 max-w-[400px]">
      <Input value={input} onChange={(e) => setInput(e.target.value)} />
      <div className="place-self-center">
        <QRCodeSVG size={256} value={input} />
      </div>
    </div>
  );
}
