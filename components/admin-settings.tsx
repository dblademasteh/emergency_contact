"use client";

import { useState } from "react";
import { AppNameManager } from "@/components/app-name-manager";
import { LogoManager } from "@/components/logo-manager";
import { HomeImage, type HomeContentLink } from "@/components/home-image";
import { FacebookFeed } from "@/components/facebook-feed";
import { AdminContentManager } from "@/components/admin-content-manager";
import { SettingsIcon } from "@/components/icons";

type AdminSettingsProps = {
  appName: string | null;
  appLogo: string | null;
  homeImage: string | null;
  homeContentImage: string | null;
  homeContentLinks: HomeContentLink[];
  facebookPageUrl: string | null;
  bfpSiteUrl: string | null;
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
        {title}
      </h2>
      {description && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function AdminSettings({
  appName,
  appLogo,
  homeImage,
  homeContentImage,
  homeContentLinks,
  facebookPageUrl,
  bfpSiteUrl,
}: AdminSettingsProps) {
  const [name, setName] = useState<string | null>(appName);
  const [logo, setLogo] = useState<string | null>(appLogo);
  const [homeImg, setHomeImg] = useState<string | null>(homeImage);
  const [contentImg, setContentImg] = useState<string | null>(homeContentImage);
  const [contentLinks, setContentLinks] =
    useState<HomeContentLink[]>(homeContentLinks);
  const [fbUrl, setFbUrl] = useState<string | null>(facebookPageUrl);
  const [bfpUrl, setBfpUrl] = useState<string | null>(bfpSiteUrl);

  return (
    <div className="space-y-4">
      <Section
        title="Branding"
        description="The app name and logo shown in the header, sign-in page, and as the app icon."
      >
        <div className="space-y-3">
          <AppNameManager name={name || "Beep Me App V2.0"} isAdmin onChanged={setName} />
          <LogoManager logo={logo} isAdmin onChanged={setLogo} />
        </div>
      </Section>

      <Section
        title="Home page"
        description="The banner image and quick links shown on the home screen."
      >
        <div className="space-y-3">
          <HomeImage
            image={homeImg}
            isAdmin
            onChanged={setHomeImg}
            endpoint="/api/settings/home-image"
            placeholder="Add a home banner photo"
            alt="Home banner"
          />
          <HomeImage
            image={contentImg}
            isAdmin
            onChanged={setContentImg}
            endpoint="/api/settings/home-content-image"
            placeholder="Add a content image"
            alt="Home content image"
            links={contentLinks}
            onLinksChanged={setContentLinks}
            linksEndpoint="/api/settings/home-content-links"
          />
        </div>
      </Section>

      <Section
        title="BFP updates"
        description="The Facebook page and website links shown in the BFP updates feed."
      >
        <FacebookFeed
          pageUrl={fbUrl}
          bfpSiteUrl={bfpUrl}
          isAdmin
          onChanged={setFbUrl}
          onBfpChanged={setBfpUrl}
        />
      </Section>

      <Section
        title="Content"
        description="Manage the contacts, groups, and pills (categories) in your directory."
      >
        <AdminContentManager />
      </Section>

      <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs text-slate-400 dark:text-slate-500">
        <SettingsIcon className="h-3.5 w-3.5" />
        Changes save instantly to the database.
      </p>
    </div>
  );
}
