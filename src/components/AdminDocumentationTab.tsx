import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight, BookOpen, User, Settings, CreditCard, Mail, Ticket, Calendar, ImageIcon, ShieldCheck, FolderOpen, Bed, Camera, Download, Loader2, MessageSquare, Inbox, Server, Sparkles } from 'lucide-react';

interface AdminDocumentationTabProps {
  primaryColor: string;
}

export const AdminDocumentationTab: React.FC<AdminDocumentationTabProps> = ({ primaryColor }) => {
  const [openSection, setOpenSection] = useState<string | null>('general');

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const generatePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPos = margin;

      const checkPageBreak = (neededHeight: number) => {
        if (yPos + neededHeight > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Premium Cover Page / Header
      doc.setFillColor(30, 30, 30);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("GRENADA CARICOM FESTIVAL 2027", pageWidth / 2, 18, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(212, 175, 55); // gold/amber accent
      doc.text("ADMINISTRATOR HANDOVER GUIDE", pageWidth / 2, 28, { align: "center" });
      
      // Ample space on top of introduction heading
      yPos = 62;

      // Introduction
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text("Orchestrating the Grenada Caricom Festival 2027", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      
      const introPara1 = "Welcome to your bespoke administrative suite. This platform is meticulously engineered to deliver a seamless, world-class digital experience for both your VIP attendees and your management team.";
      const introLines1 = doc.splitTextToSize(introPara1, contentWidth - 10);
      doc.text(introLines1, pageWidth / 2, yPos, { align: "center" });
      yPos += (introLines1.length * 5.5) + 4;
      
      const introPara2 = "From managing luxury accommodation and secure pass allocations, to real-time event itinerary control and automated guest communications, every aspect of the 10-day festival is at your fingertips. This dynamic handover guide provides comprehensive insights into operating and scaling your festival's digital infrastructure with absolute confidence.";
      const introLines2 = doc.splitTextToSize(introPara2, contentWidth - 10);
      doc.text(introLines2, pageWidth / 2, yPos, { align: "center" });
      yPos += (introLines2.length * 5.5) + 16;

      doc.setTextColor(50, 50, 50);

      sections.forEach((section) => {
        checkPageBreak(15);
        
        // Section Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(section.title.toUpperCase(), margin, yPos);
        yPos += 8;
        
        // Line separator
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;

        section.qa.forEach((item) => {
          // Question
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(15, 23, 42); // slate-900
          
          const qLines = doc.splitTextToSize(`Q: ${item.q}`, contentWidth);
          checkPageBreak(qLines.length * 6 + 15);
          doc.text(qLines, margin, yPos);
          yPos += (qLines.length * 5);
          
          // Answer
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105); // slate-600
          
          const aLines = doc.splitTextToSize(`A: ${item.a}`, contentWidth);
          doc.text(aLines, margin, yPos);
          yPos += (aLines.length * 5) + 8; // extra spacing after answer
        });
        
        yPos += 10; // extra spacing after section
      });

      // Footer with page numbers
      const pageCount = (doc as any).getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`Confidential • Admin Handover Guide • Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
      }

      doc.save("Grenada_Festival_Admin_Guide.pdf");
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  const toggleSection = (id: string) => {
    setOpenSection(prev => prev === id ? null : id);
  };

  const sections = [
    {
      id: 'general',
      icon: <BookOpen className="w-5 h-5" />,
      title: 'General Overview & Dashboard',
      qa: [
        {
          q: 'What is this Admin Dashboard for?',
          a: 'This dashboard is the central command centre for the Grenada Caricom Festival 2027 platform. It allows you to manage website content, monitor ticket sales, handle customer support enquiries, and customise the look and feel of the platform without touching the underlying code.'
        },
        {
          q: 'How are changes saved across the platform?',
          a: 'Most tabs feature a dedicated "Save Changes" or "Update" button at the bottom of their respective forms. When you modify text, images, or configuration settings, you must click this button to commit your changes to the live site.'
        },
        {
          q: 'How do I track festival performance?',
          a: 'The "Analytics Dashboard" tab provides real-time insights into revenue, pass sales distribution, and customer enquiries. It automatically aggregates data from your confirmed orders.'
        },
        {
          q: 'How do I backup my data?',
          a: 'Navigate to the "Backup & Restore" tab. From here, you can export all your orders, submissions, and platform configurations into a portable JSON file for your records or to transfer data between environments.'
        }
      ]
    },
    {
      id: 'branding',
      icon: <Settings className="w-5 h-5" />,
      title: 'Customiser Studio (Branding)',
      qa: [
        {
          q: 'What is the Customiser Studio?',
          a: 'The Branding tab allows you to update the global site configuration, including the festival name, description, primary accent colours, and typography settings. You can select meticulously paired typography and colour presets to instantly change the vibe.'
        },
        {
          q: 'Where do I update the images used across the site?',
          a: 'The "Page Images" tab allows you to configure which images appear on the Home Page, About pages, and standard Header Banners. You can select images from your Media Library or upload new ones directly.'
        }
      ]
    },
    {
      id: 'media_library',
      icon: <FolderOpen className="w-5 h-5" />,
      title: 'Media Library',
      qa: [
        {
          q: 'What is the Media Library?',
          a: 'The Media Library is a central file repository for all your uploaded images. Instead of uploading the same image multiple times (like a sponsor logo or DJ photo), you upload it once here.'
        },
        {
          q: 'How do I use assets from the Media Library?',
          a: 'Whenever you edit a Page Image, an Event, or a Hotel, you will see a "Select from Library" option. Clicking this opens a browser to let you pick an existing image directly from this tab.'
        }
      ]
    },
    {
      id: 'gallery',
      icon: <Camera className="w-5 h-5" />,
      title: 'Gallery Media',
      qa: [
        {
          q: 'What is the Gallery Media board?',
          a: 'The Gallery Media tab controls the public-facing image and video gallery on the website. This is where attendees go to see visual highlights of the festival.'
        },
        {
          q: 'How do I add or manage photos in the gallery?',
          a: 'Click "Add New Media". You can upload an image file or provide a direct video URL (like a YouTube or Vimeo link). You can also edit existing items to change their categories, aspect ratios, or delete them if they should no longer be displayed.'
        }
      ]
    },
    {
      id: 'testimonials',
      icon: <MessageSquare className="w-5 h-5" />,
      title: 'Testimonials',
      qa: [
        {
          q: 'How do I manage testimonials?',
          a: 'The Testimonials tab allows you to showcase feedback from previous attendees or partners. You can add the reviewer\'s name, their role, their location, the review text (quote), a rating, and a profile photo.'
        },
        {
          q: 'How do I remove a testimonial?',
          a: 'You can simply edit an existing testimonial and click the Delete button. This permanently removes it from the public front-end.'
        }
      ]
    },
    {
      id: 'events',
      icon: <Calendar className="w-5 h-5" />,
      title: 'Event Manager',
      qa: [
        {
          q: 'How is the festival schedule managed?',
          a: 'Use the "Event Manager" tab to build the official itinerary. You can add distinct events, specifying their date, time, venue, and a descriptive summary.'
        },
        {
          q: 'How do I categorise events?',
          a: 'When creating or editing an event, you select a specific "Category" (like Music, Party, or Adventure). This determines how it is labelled and filtered on the main event lineup schedule.'
        }
      ]
    },
    {
      id: 'hotels',
      icon: <Bed className="w-5 h-5" />,
      title: 'Hotels',
      qa: [
        {
          q: 'What is the Hotels tab?',
          a: 'This module manages the list of partner accommodation shown on the Transportation & Logistics page. It helps attendees find vetted places to stay.'
        },
        {
          q: 'What does the "Spotlight / Recommended" toggle do?',
          a: 'Marking a hotel as Recommended places a special highlight badge on its card, making it stand out to attendees. This is great for premium sponsors or official festival hotels.'
        }
      ]
    },
    {
      id: 'tickets',
      icon: <Ticket className="w-5 h-5" />,
      title: 'Pass Orders & Manager',
      qa: [
        {
          q: 'How do I add or modify festival passes?',
          a: 'Go to the "Passes" tab. You can create new pass tiers, set pricing, and define what perks each pass includes. Changes here instantly reflect on the Shop and Home pages.'
        },
        {
          q: 'How do attendees receive their tickets?',
          a: 'Once an order is marked as "Confirmed", the system generates a secure E-Ticket/Voucher with a unique ID and barcode.'
        }
      ]
    },
    {
      id: 'payments',
      icon: <CreditCard className="w-5 h-5" />,
      title: 'Payment Gateway',
      qa: [
        {
          q: 'How does the Payment Gateway work?',
          a: 'The "Payments" tab manages your transaction methods. It supports bank transfers ("Reserve & Pay Later") and direct gateway integrations. You can manage your banking instructions here so users know exactly where to wire funds.'
        },
        {
          q: 'How do I track and manage orders?',
          a: 'The "Pass Orders" tab lists all purchased passes. Customers will upload payment receipts, which you can review. Once funds clear in your account, manually mark the order as "Confirmed".'
        }
      ]
    },
    {
      id: 'submissions',
      icon: <Inbox className="w-5 h-5" />,
      title: 'Received Forms',
      qa: [
        {
          q: 'Where do Contact Page messages go?',
          a: 'All messages submitted through the public Contact Page form, flight registrations, and transport requests are routed directly to the "Received Forms" tab for your team to review.'
        },
        {
          q: 'How do I reply to a user enquiry?',
          a: 'Click on any submission to view its details. You can reply directly via the integrated Email Suite or your local mail client. Replying via the Email Suite automatically logs the interaction.'
        }
      ]
    },
    {
      id: 'communications',
      icon: <Mail className="w-5 h-5" />,
      title: 'Email Suite',
      qa: [
        {
          q: 'What is the Email Suite?',
          a: 'The "Email Suite" is a built-in module for dispatching transactional emails (like Order Confirmations or Registration Approvals). You can manage templates, adjust SMTP/API delivery settings, and review your Outbox history here.'
        },
        {
          q: 'How do I update the "From" address for automated emails?',
          a: 'Navigate to the "Email Suite" tab and select "Provider Settings". Here you can update your SMTP credentials, sender name, and the outgoing email address used for system notifications.'
        }
      ]
    },
    {
      id: 'system',
      icon: <Server className="w-5 h-5" />,
      title: 'Operations',
      qa: [
        {
          q: 'What is the Operations tab used for?',
          a: 'The Operations tab provides high-level system maintenance, infrastructure controls, and essential security configurations.'
        },
        {
          q: 'What tools are available in Operations?',
          a: 'You can export all submissions to a portable CSV spreadsheet, bulk import records from a CSV file, and reset sample logs to their default demo states for testing.'
        },
        {
          q: 'How do I change the Admin Dashboard URL or Passcode?',
          a: 'Under the "Operations Security Credentials" section, you can configure a custom Secret URL Path (e.g., /my-secret-admin) and change the Access Passcode / PIN used to log in. Note that both these Operations settings and the Owner Control settings operate independently but are accepted globally.'
        }
      ]
    },
    {
      id: 'admin_users',
      icon: <ShieldCheck className="w-5 h-5" />,
      title: 'Console Users (RBAC)',
      qa: [
        {
          q: 'How do I add new administrators?',
          a: 'If you have the "Admin" role, navigate to the "Console Users" tab to provision new accounts. You must assign them a specific role which automatically limits which tabs they can see.'
        },
        {
          q: 'Can I reset a user\'s password?',
          a: 'Yes, Master Admins can edit existing users to reset their passwords or revoke access entirely by changing their status to "Suspended". Suspended users cannot log in.'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center border border-neutral-700">
            <HelpCircle className="w-6 h-6 text-neutral-300" />
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-1">
            <div>
              <h2 className="text-2xl font-bold text-white font-serif tracking-wide">Documentation & Handover Guide</h2>
              <p className="text-neutral-400 text-sm mt-1">
                A comprehensive Q&A breakdown of site functionality to assist new administrators and operators in managing the platform.
              </p>
            </div>
            
            <button
              onClick={generatePdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor, color: '#000' }}
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF Guide
                </>
              )}
            </button>
          </div>

        </div>

        <div className="mt-8 mb-8 p-6 sm:p-8 rounded-2xl relative overflow-hidden group border border-neutral-800/60 flex flex-col items-center justify-center text-center" style={{ backgroundColor: `${primaryColor}08` }}>
          <div className="absolute -top-10 -right-10 p-8 opacity-10 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12">
            <Sparkles className="w-48 h-48" style={{ color: primaryColor }} />
          </div>
          
          <div className="relative z-10 max-w-3xl flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: primaryColor }}>Welcome to the Command Centre</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-4 leading-tight text-center">
              Orchestrating the Grenada Caricom Festival 2027
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed font-light mb-4 text-center">
              Welcome to your bespoke administrative suite. This platform is meticulously engineered to deliver a seamless, world-class digital experience for both your VIP attendees and your management team. 
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed font-light text-center">
              From managing luxury accommodation and secure pass allocations, to real-time event itinerary control and automated guest communications, every aspect of the 10-day festival is at your fingertips. This dynamic handover guide provides comprehensive insights into operating and scaling your festival's digital infrastructure with absolute confidence.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {sections.map((section) => (
            <div 
              key={section.id}
              className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/50"
            >
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-neutral-400" style={{ color: openSection === section.id ? primaryColor : undefined }}>
                    {section.icon}
                  </div>
                  <h3 className="font-bold text-white text-lg">{section.title}</h3>
                </div>
                {openSection === section.id ? (
                  <ChevronDown className="w-5 h-5 text-neutral-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                )}
              </button>
              
              {openSection === section.id && (
                <div className="px-6 pb-6 pt-2 space-y-6 border-t border-neutral-800 bg-neutral-900/30">
                  {section.qa.map((qa, index) => (
                    <div key={index} className="space-y-2">
                      <h4 className="text-white font-semibold text-[15px] flex items-start gap-2">
                        <span className="text-neutral-500 font-mono text-sm mt-0.5">Q.</span>
                        {qa.q}
                      </h4>
                      <p className="text-neutral-400 text-sm leading-relaxed flex items-start gap-2">
                        <span className="text-neutral-500 font-mono text-sm mt-0.5">A.</span>
                        <span className="flex-1">{qa.a}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3">
          <BookOpen className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200 leading-relaxed">
            <strong className="text-blue-300 block mb-1">Developer Note:</strong>
            This documentation is intended for operational handover. To view raw database structures or access technical analytics, please consult the respective modules. When making structural modifications, ensure you follow the RBAC (Role-Based Access Control) guidelines so permissions remain secure.
          </div>
        </div>
      </div>
    </div>
  );
};
