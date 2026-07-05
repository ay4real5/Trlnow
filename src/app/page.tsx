"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Truck, MapPin, Clock, Shield } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function HomePage() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      router.push(`/track/${trackingNumber.trim().toUpperCase()}`);
    }
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Track your shipments in <span className="text-brand-600">real-time</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Enter your tracking number below to see the full journey of your package — from pickup to delivery.
            </p>

            <form onSubmit={handleTrack} className="mx-auto mt-8 flex max-w-xl gap-3">
              <Input
                type="text"
                placeholder="e.g. TRL-0001-0001"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="h-12 text-base"
              />
              <Button type="submit" className="h-12 px-6">
                <Search className="mr-2 h-5 w-5" />
                Track
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Package, title: "Easy Booking", desc: "Create shipments in seconds with automated tracking numbers." },
            { icon: Truck, title: "Real-time Tracking", desc: "Follow your package through every stage of its journey." },
            { icon: Shield, title: "Secure & Reliable", desc: "Your shipments are handled with care at every branch." },
            { icon: Clock, title: "On-time Delivery", desc: "Get estimated delivery dates and status notifications." },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                  <Icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {[
              { step: "1", icon: Package, title: "Book", desc: "Create a shipment online or at any branch." },
              { step: "2", icon: MapPin, title: "Track", desc: "Monitor progress through origin, transit, and delivery." },
              { step: "3", icon: Truck, title: "Receive", desc: "Get notified when your package is delivered." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative rounded-xl bg-white p-8 shadow-sm">
                  <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {item.step}
                  </div>
                  <Icon className="mb-4 h-8 w-8 text-brand-600" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 font-bold text-brand-600">
              <Package className="h-5 w-5" />
              TrlNow
            </div>
            <p className="text-sm text-gray-500">© 2025 TrlNow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
