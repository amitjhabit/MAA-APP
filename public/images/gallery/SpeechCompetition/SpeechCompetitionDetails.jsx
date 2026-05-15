import React from 'react'
import { Link } from 'react-router-dom'
import speechCompetition_img1 from '../SpeechCompetition/SpeechCompetitionImage/img-1.jpg';
import speechCompetition_img2 from '../SpeechCompetition/SpeechCompetitionImage/img-2.jpg';
import speechCompetition_img3 from '../SpeechCompetition/SpeechCompetitionImage/img-3.jpg';
import speechCompetition_img4 from '../SpeechCompetition/SpeechCompetitionImage/img-4.jpg';
import speechCompetition_img5 from '../SpeechCompetition/SpeechCompetitionImage/img-5.jpg';
import speechCompetition_img6 from '../SpeechCompetition/SpeechCompetitionImage/img-6.jpg';
import './SpeechCompetitionDetails.css';
import Footer from '../Footer';

const SpeechCompetitionDetails = () => {
  return (
    <>
    <div className='speech_details'>
        <div className='speech_container'>
            <h3>Speech Competition Details</h3>
            <p>
               What an incredible day it was at GURUKUL UTSAV! 
               This year marked a special milestone — for the first time ever, MAA proudly hosted the Maithili Speaking Competition! Our heartfelt gratitude goes to all the amazing kids who stepped up with such dedication, confidence, and spirit. You truly made us proud! 
               A huge shout-out to the parents for their constant encouragement and support. Your involvement made all the difference. 🙏
            </p>
            <div className='speech_main'>
                <span>Date: 9 August 2025</span>
                <div className='speech_img'>
                    <img src={speechCompetition_img1} alt=''/>
                </div>

                <div className='speech_img'>
                    <img src={speechCompetition_img2} alt=''/>
                </div>

                <div className='speech_img'>
                    <img src={speechCompetition_img3} alt=''/>
                </div>

                 <div className='speech_img'>
                    <img src={speechCompetition_img4} alt=''/>
                </div>

                 <div className='speech_img'>
                    <img src={speechCompetition_img5} alt=''/>
                </div>

                 <div className='speech_img'>
                    <img src={speechCompetition_img6} alt=''/>
                </div>
            </div>
            <Link to='/news'>Back</Link>
        </div>
    </div>
    <Footer/>
    </>
  )
}

export default SpeechCompetitionDetails;