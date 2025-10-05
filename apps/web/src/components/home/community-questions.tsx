'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MessageCircle, Heart, CheckCircle, Clock, BookOpen, Users } from 'lucide-react';
import { useCommunityQuestions } from '@/hooks/use-community-questions';

interface CommunityQuestion {
  id: string;
  title: string;
  excerpt: string;
  author: {
    nom: string;
    avatar?: string;
  };
  book: {
    id: string;
    titre: string;
    auteur: string;
    image_couverture?: string;
  };
  status: 'ANSWERED' | 'PENDING';
  likes_count: number;
  answers_count: number;
  date_question: string;
  is_public: boolean;
}

interface CommunityQuestionsProps {}

function QuestionCard({ question, index }: { question: CommunityQuestion; index: number }) {
  const isAnswered = question.status === 'ANSWERED';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      <Link href={`/books/${question.book.id}/questions/${question.id}` as any}>
        <div
          className="relative p-6 rounded-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(139, 21, 56, 0.1)",
            boxShadow: "0 8px 32px rgba(139, 21, 56, 0.05)"
          }}
        >
          {/* Decorative background */}
          <div 
            className="absolute top-0 right-0 w-24 h-24 opacity-5"
            style={{
              background: 'radial-gradient(circle, #8B1538 0%, transparent 70%)',
              transform: "translate(50%, -50%)"
            }}
          />

          {/* Status badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isAnswered ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  Répondu
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                  <Clock className="w-3 h-3" />
                  En attente
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-xs opacity-60">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {question.likes_count}
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {question.answers_count}
              </div>
            </div>
          </div>

          {/* Question content */}
          <div className="mb-4">
            <h3 
              className="text-lg font-bold mb-2 leading-tight group-hover:text-[#8B1538] transition-colors duration-300 line-clamp-2"
              style={{
                fontFamily: 'Playfair Display, serif',
                color: '#2C1810'
              }}
            >
              {question.title}
            </h3>
            
            <p 
              className="text-sm opacity-75 line-clamp-2"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#2C1810',
                lineHeight: "1.5"
              }}
            >
              {question.excerpt}
            </p>
          </div>

          {/* Book info */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-white/50">
            <div className="w-10 h-12 relative flex-shrink-0">
              <Image
                src={question.book.image_couverture || '/placeholder-book.svg'}
                alt={`Couverture de ${question.book.titre}`}
                fill
                className="object-cover rounded"
                sizes="40px"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold mb-1 truncate"
                style={{
                  fontFamily: "Playfair Display, serif",
                  color: '#8B1538'
                }}
                title={question.book.titre}
              >
                {question.book.titre}
              </p>
              <p 
                className="text-xs opacity-70 truncate"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  color: '#2C1810'
                }}
              >
                par {question.book.auteur}
              </p>
            </div>
          </div>

          {/* Author info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                <span 
                  className="text-xs font-bold"
                  style={{ color: '#8B1538' }}
                >
                  {question.author.nom.charAt(0).toUpperCase()}
                </span>
              </div>
              <span 
                className="text-xs font-medium"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  color: '#6B4C7B'
                }}
              >
                {question.author.nom}
              </span>
            </div>
            
            <span 
              className="text-xs opacity-50"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#2C1810'
              }}
            >
              {new Date(question.date_question).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: "short"
              })}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function QuestionSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="p-6 rounded-2xl animate-pulse"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        border: "1px solid rgba(139, 21, 56, 0.05)"
      }}
    >
      <div className="flex justify-between mb-4">
        <div className="h-5 bg-gray-200 rounded-full w-16"></div>
        <div className="flex gap-2">
          <div className="h-4 bg-gray-200 rounded w-8"></div>
          <div className="h-4 bg-gray-200 rounded w-8"></div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="h-5 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
      
      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-100 rounded-lg">
        <div className="w-10 h-12 bg-gray-200 rounded"></div>
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
    </motion.div>
  );
}

export function CommunityQuestions({}: CommunityQuestionsProps) {
  const { data: questions, isLoading, error } = useCommunityQuestions();

  // Ne rien afficher si pas de données
  if (questions.length === 0 && !isLoading) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 rounded-lg w-80 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <QuestionSkeleton key={index} index={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 
            className="text-4xl font-bold mb-4"
            style={{
              fontFamily: 'Playfair Display, serif',
              color: '#2C1810'
            }}
          >
            Nos âmes complices se questionnent
          </h2>
          <p 
            className="text-lg opacity-75 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            Questions, débats et partages autour de nos lectures favorites
          </p>
        </motion.div>

        {/* Questions Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={"/questions" as any}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: 'rgba(139, 21, 56, 0.08)',
                color: '#8B1538',
                border: '1px solid rgba(139, 21, 56, 0.2)',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              <Users className="w-4 h-4" />
              Rejoindre les débats
            </Link>
            
            <Link
              href={"/questions/new" as any}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                background: 'linear-gradient(135deg, #8B1538, #6B4C7B)',
                color: 'white',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              <MessageCircle className="w-4 h-4" />
              Poser ma question
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}