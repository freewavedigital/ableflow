import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, Code2, Globe, Copy, CheckCheck, ExternalLink } from "lucide-react";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition font-medium">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeBlock({ code }) {
  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap break-all">
        {code}
      </pre>
      <div className="absolute top-3 right-3">
        <CopyButton text={code} />
      </div>
    </div>
  );
}

export default function WebsiteFormPublishPanel({ template, onClose }) {
  const baseUrl = window.location.origin;
  const formUrl = `${baseUrl}/f/${template.id}`;

  const iframeCode = `<iframe
  src="${formUrl}"
  width="100%"
  height="700"
  frameborder="0"
  style="border:none; max-width:640px; display:block; margin:0 auto;"
  title="${template.name}"
  loading="lazy"
></iframe>`;

  const embedCode = `<!-- Able Leak Detection - ${template.name} -->
<div id="able-form-${template.id}"></div>
<script>
  (function() {
    var el = document.getElementById('able-form-${template.id}');
    var iframe = document.createElement('iframe');
    iframe.src = '${formUrl}';
    iframe.style.width = '100%';
    iframe.style.height = '700px';
    iframe.style.border = 'none';
    iframe.style.maxWidth = '640px';
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';
    iframe.frameBorder = '0';
    iframe.title = '${template.name}';
    el.appendChild(iframe);
  })();
</script>`;

  if (template.status !== "active") {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publish Form</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4">
            This form must be <strong>Active</strong> before it can be published. Activate it from the Forms page first.
          </div>
          <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            Publish — {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          Submissions automatically create a <strong>Lead</strong> record in your Enquiries pipeline and notify the configured email address.
        </div>

        <Tabs defaultValue="link">
          <TabsList className="w-full">
            <TabsTrigger value="link" className="flex-1 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> Direct Link
            </TabsTrigger>
            <TabsTrigger value="iframe" className="flex-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> iFrame
            </TabsTrigger>
            <TabsTrigger value="embed" className="flex-1 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" /> Embed Script
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">Share this link directly with customers or add it to your website's "Contact Us" button.</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 truncate">
                {formUrl}
              </div>
              <CopyButton text={formUrl} />
              <a href={formUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Preview
                </Button>
              </a>
            </div>
          </TabsContent>

          <TabsContent value="iframe" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">Paste this code into any webpage to embed the form directly.</p>
            <CodeBlock code={iframeCode} />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Adjust <code className="bg-gray-100 px-1 rounded">height</code> to suit your page layout</p>
              <p>• Add <code className="bg-gray-100 px-1 rounded">width="100%"</code> for full-width layouts</p>
              <p>• Works on any website builder (Wix, Squarespace, Webflow, WordPress, etc.)</p>
            </div>
          </TabsContent>

          <TabsContent value="embed" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">Dynamically inject the form using a JavaScript snippet — no iframe tag needed.</p>
            <CodeBlock code={embedCode} />
            <div className="text-xs text-muted-foreground">
              <p>• Place the <code className="bg-gray-100 px-1 rounded">&lt;div&gt;</code> where you want the form, then include the script anywhere on the page</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}