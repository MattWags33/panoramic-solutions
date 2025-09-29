'use client';

import { motion } from 'framer-motion';
import Image from 'next/image'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fadeInUp, slideInLeft, slideInRight, staggerContainer } from '@/shared/utils/motion';
import { StructuredData, personData } from '@/components/seo/StructuredData';
import {
  Award,
  Users,
  Mountain,
  ArrowRight,
  Globe,
  Code
} from 'lucide-react';

const certifications = [
  {
    name: 'PMP® - Project Management Professional',
    issuer: 'Project Management Institute (PMI)',
    image: '/images/certifications/pmp.png',
  },
  {
    name: 'Certified SAFe 6 Agilist',
    issuer: 'Scaled Agile, Inc.',
    image: '/images/certifications/safe.png',
  },
  {
    name: 'Airtable Builder Accreditation',
    issuer: 'Airtable',
    image: '/images/certifications/airtable.png',
  },
  {
    name: 'Smartsheet Core Product Certified',
    issuer: 'Smartsheet',
    image: '/images/certifications/smartsheet.png',
  },
  {
    name: 'Smartsheet Aligned Certified Solution Professional',
    issuer: 'Smartsheet',
    image: '/images/certifications/smartsheet.png',
  },
];

const personalStats = [
  { value: '15+', label: 'Years Experience', prefix: '', suffix: '' },
  { value: '100+', label: 'Digital Transformations', prefix: '', suffix: '' },
  { value: '98', label: 'Client Satisfaction', prefix: '', suffix: '%' },
];

export default function AboutPage() {
  return (
    <>
      <StructuredData data={personData} />
      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 bg-white">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Left Column - Photo */}
            <motion.div
              variants={slideInLeft}
              initial="initial"
              animate="animate"
              className="order-2 lg:order-1"
            >
              <div className="relative max-w-md mx-auto lg:max-w-none">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl bg-white">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/MattWagnerHeadshot.webp"
                      alt="Matt Wagner - Solutions Architect & Founder at Panoramic Solutions"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
                {/* Floating card */}
                <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 bg-white p-4 sm:p-6 rounded-xl shadow-xl border border-gray-200">
                  <div className="text-xl sm:text-2xl font-bold text-alpine">PMP®</div>
                  <div className="text-xs sm:text-sm text-gray-600">SAFe 6 Agilist</div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Story */}
            <motion.div
              variants={slideInRight}
              initial="initial"
              animate="animate"
              className="order-1 lg:order-2"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-midnight mb-4 sm:mb-6">
                Welcome
              </h1>
              
              <div className="space-y-4 sm:space-y-6 text-base sm:text-lg text-gray-600 leading-relaxed">
                <p>
                  I&apos;m Matt Wagner, founder and Solutions Architect at Panoramic Solutions. I work with a close team of specialists to deliver technology solutions that are simple, effective, and built around your needs. My background in Mechanical Engineering from Virginia Tech helped create a foundation for breaking down complex problems, which I bring to my work in project portfolio consulting, SaaS rollouts, workflow automation, and technical development. Outside of work, the problem-solving continues in the outdoors, whether I&apos;m hiking rugged trails, skiing fresh powder, climbing rock faces, or navigating remote canyons.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                <Button
                  asChild
                  size="lg"
                  className="bg-alpine hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4" 
                  style={{ minHeight: '48px' }}
                >
                  <a 
                    href="https://app.onecal.io/b/matt-wagner/schedule-a-meeting-with-matt"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Book A Call <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* Certifications Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-snow">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-midnight mb-4 sm:mb-6">
              <span className="text-midnight">Certifications</span> & Credentials
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Committed to continuous learning and growth to stay ahead in digital transformation and project management best practices.
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            {/* First row - 3 certifications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-items-center mb-6 sm:mb-8">
              {certifications.slice(0, 3).map((cert, index) => (
                <motion.div
                  key={cert.name}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="text-center h-full bg-white border border-gray-200">
                    <CardContent className="p-6 sm:p-8">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <Award className="h-8 w-8 sm:h-12 sm:w-12 text-alpine" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-midnight mb-2">
                        {cert.name}
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base">{cert.issuer}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            {/* Second row - 2 certifications centered */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center items-center">
              {certifications.slice(3, 5).map((cert, index) => (
                <motion.div
                  key={cert.name}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: (index + 3) * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="text-center h-full bg-white border border-gray-200">
                    <CardContent className="p-6 sm:p-8">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <Award className="h-8 w-8 sm:h-12 sm:w-12 text-alpine" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-midnight mb-2">
                        {cert.name}
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base">{cert.issuer}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Personal Section - Beyond Business */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-midnight mb-4 sm:mb-6">
              Skills & <span className="text-midnight">Specialties</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Specialized expertise in key areas that drive digital transformation and operational excellence
            </p>
          </motion.div>
          
                     <div className="max-w-5xl mx-auto">
             {/* First row - 3 skills */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-items-center mb-6 sm:mb-8">
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6 }}
                 viewport={{ once: true }}
                 className="bg-gray-50 rounded-xl p-6 shadow-md border border-gray-200"
               >
                 <h3 className="text-xl font-bold text-midnight mb-3 flex items-center">
                   <div className="bg-blue-50 p-2 rounded-lg mr-3">
                     <Globe className="h-5 w-5 text-alpine" />
                   </div>
                   SaaS Architecture
                 </h3>
                 <p className="text-gray-600">Enterprise-grade SaaS platform design and implementation with focus on scalability, security, and performance optimization.</p>
               </motion.div>
               
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: 0.1 }}
                 viewport={{ once: true }}
                 className="bg-gray-50 rounded-xl p-6 shadow-md border border-gray-200"
               >
                 <h3 className="text-xl font-bold text-midnight mb-3 flex items-center">
                   <div className="bg-blue-50 p-2 rounded-lg mr-3">
                     <Code className="h-5 w-5 text-alpine" />
                   </div>
                   Enterprise Automations
                 </h3>
                 <p className="text-gray-600">Streamline operations and eliminate manual processes through intelligent automation solutions that integrate with existing systems.</p>
               </motion.div>
               
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: 0.2 }}
                 viewport={{ once: true }}
                 className="bg-gray-50 rounded-xl p-6 shadow-md border border-gray-200"
               >
                 <h3 className="text-xl font-bold text-midnight mb-3 flex items-center">
                   <div className="bg-blue-50 p-2 rounded-lg mr-3">
                     <Award className="h-5 w-5 text-alpine" />
                   </div>
                   Business Systems Implementation
                 </h3>
                 <p className="text-gray-600">End-to-end implementation of business systems including Airtable, Smartsheet, and custom solutions tailored to your needs.</p>
               </motion.div>
             </div>
             
             {/* Second row - 2 skills centered */}
             <div className="flex flex-col md:flex-row gap-6 sm:gap-8 justify-center items-center">
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: 0.3 }}
                 viewport={{ once: true }}
                 className="bg-gray-50 rounded-xl p-6 shadow-md border border-gray-200"
               >
                 <h3 className="text-xl font-bold text-midnight mb-3 flex items-center">
                   <div className="bg-blue-50 p-2 rounded-lg mr-3">
                     <Users className="h-5 w-5 text-alpine" />
                   </div>
                   Application Development
                 </h3>
                 <p className="text-gray-600">Custom software solutions to meet your business needs, with a focus on user experience and integration with existing systems.</p>
               </motion.div>
               
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: 0.4 }}
                 viewport={{ once: true }}
                 className="bg-gray-50 rounded-xl p-6 shadow-md border border-gray-200"
               >
                 <h3 className="text-xl font-bold text-midnight mb-3 flex items-center">
                   <div className="bg-blue-50 p-2 rounded-lg mr-3">
                     <Mountain className="h-5 w-5 text-alpine" />
                   </div>
                   Project Portfolio Management
                 </h3>
                 <p className="text-gray-600">Strategic oversight and optimization of project portfolios to ensure alignment with business goals and maximize return on investment.</p>
               </motion.div>
             </div>
           </div>
        </div>
      </section>


      
      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-alpine">
        <div className="container max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Let&apos;s Build a Better Way to Work
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Ready to reimagine how your organization can utilize user-centric digital technologies? 
              Let&apos;s start with a conversation about your transformation goals.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white hover:bg-gray-100 text-alpine font-semibold px-6 sm:px-8 py-3 sm:py-4"
              style={{ minHeight: '48px' }}
            >
              <a 
                href="https://app.onecal.io/b/matt-wagner/schedule-a-meeting-with-matt"
                target="_blank"
                rel="noopener noreferrer"
              >
                Book A Call <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
}