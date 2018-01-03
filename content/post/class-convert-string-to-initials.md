+++
author = "daxingplay"
categories = ["class", "PHP", "字符串"]
date = 2010-06-21T23:18:03Z
description = ""
draft = false
slug = "class-convert-string-to-initials"
tags = ["class", "PHP", "字符串"]
title = "【PHP类收集】将字符串转换为拼音首字母组成的新字符串"
aliases = [
    "/class-convert-string-to-initials/"
]
+++


最近在做一个物流评价推介系统，一个小组6个人，相当于是我们的作业，做好了就不用参加期末考试了，嘿嘿。我是我这组的技术开发负责人，说白了，系统是我一个人做的，很累，做了好几天了，不过很多功能都实现了，也学了不少东西。看来做项目真的是学习的一个进步很快的手段！

在做系统的时候，有些不会的问题，我就去网上搜索或者是查找PHP手册之类的，还找到了一些PHP很好用的类。于是当然收藏起噻。也作为我的学习笔记吧。

  
 这个我觉得是最好用最全的，当然还有另外几个函数，也收藏起吧。

<?php /**
* created by wangbinandi@gmail.com at 2008-12-29 21:12
* 汉字拼音首字母工具类
*  注： 英文的字串：不变返回(包括数字)    eg .abc123 =?>
 abc123 * 中文字符串：返回拼音首字符 eg. 王小明 => WXM * 中英混合串: 返回拼音首字符和英文 eg. 我i我j => WIWJ * eg. * $py = new PYInitials(); * $result = $py->getInitials('王小明'); */ class PYInitials { private $_pinyins = array( 176161 => 'A', 176197 => 'B', 178193 => 'C', 180238 => 'D', 182234 => 'E', 183162 => 'F', 184193 => 'G', 185254 => 'H', 187247 => 'J', 191166 => 'K', 192172 => 'L', 194232 => 'M', 196195 => 'N', 197182 => 'O', 197190 => 'P', 198218 => 'Q', 200187 => 'R', 200246 => 'S', 203250 => 'T', 205218 => 'W', 206244 => 'X', 209185 => 'Y', 212209 => 'Z', ); private $_charset = null; /** * 构造函数, 指定需要的编码 default: utf-8 * 支持utf-8, gb2312 * * @param unknown_type $charset */ public function __construct( $charset = 'utf-8' ) { $this->_charset = $charset; } /** * 中文字符串 substr * * @param string $str * @param int $start * @param int $len * @return string */ private function _msubstr ($str, $start, $len) { $start = $start * 2; $len = $len * 2; $strlen = strlen($str); $result = ''; for ( $i = 0; $i = $start && $i 129 ) $result .= substr($str, $i, 2); else $result .= substr($str, $i, 1); } if ( ord(substr($str, $i, 1)) > 129 ) $i++; } return $result; } /** * 字符串切分为数组 (汉字或者一个字符为单位) * * @param string $str * @return array */ private function _cutWord( $str ) { $words = array(); while ( $str != "" ) { if ( $this->_isAscii($str) ) {//非中文 $words[] = $str[0]; $str = substr( $str, strlen($str[0]) ); }else{ $word = $this->_msubstr( $str, $i, 1 ); $words[] = $word; $str = substr( $str, strlen($word) ); } } return $words; } /** * 判断字符是否是ascii字符 * * @param string $char * @return bool */ private function _isAscii( $char ) { return ( ord( substr($char,0,1) ) = 3 ? 3: 2; $chars = array(); for( $i = 1; $i _isAscii( $str[$i] ) ? 'yes':'no'; } $result = array_count_values( $chars ); if ( empty($result['no']) ){ return true; } return false; } /** * 获取中文字串的拼音首字符 * * @param string $str * @return string */ public function getInitials( $str ) { if ( empty($str) ) return ''; if ( $this->_isAscii($str[0]) && $this->_isAsciis( $str )){ return $str; } $result = array(); if ( $this->_charset == 'utf-8' ){ $str = iconv( 'utf-8', 'gb2312', $str ); } $words = $this->_cutWord( $str ); foreach ( $words as $word ) { if ( $this->_isAscii($word) ) {//非中文 $result[] = $word; continue; } $code = ord( substr($word,0,1) ) * 1000 + ord( substr($word,1,1) ); //获取拼音首字母A--Z if ( ($i = $this->_search($code)) != -1 ){ $result[] = $this->_pinyins[$i]; } } return strtoupper(implode('',$result)); } private function _getChar( $ascii ) { if ( $ascii >= 48 && $ascii =65 && $ascii=97 && $ascii_pinyins); $lower = 0; $upper = sizeof($data); if ( $code $upper ){ return $data[$lower-1]; } $tmp = (int) round(($lower + $upper) / 2); if ( !isset($data[$tmp]) ) return $data[$middle]; else $middle = $tmp; if ( $data[$middle]

另外，还收藏了几个，都放在一块儿吧，以后好找。

 function getinitial($str) { $asc=ord(substr($str,0,1)); if ($asc=48 && $asc=65 && $asc=97 && $asc=176161 && $asc=176197 && $asc=178193 && $asc=180238 && $asc=182234 && $asc=183162 && $asc=184193 && $asc=185254 && $asc=187247 && $asc=191166 && $asc=192172 && $asc=194232 && $asc=196195 && $asc=197182 && $asc=197190 && $asc=198218 && $asc=200187 && $asc=200246 && $asc=203250 && $asc=205218 && $asc=206244 && $asc=209185 && $asc=212209){ return 'Z'; }else{ return '~'; } } }

PHP获取拼音首字母

 $letters=array( 'A'=>0xB0C4, 'B'=>0xB2C0, 'C'=>0xB4ED, 'D'=>0xB6E9, 'E'=>0xB7A1, 'F'=>0xB8C0, 'G'=>0xB9FD, 'H'=>0xBBF6, 'J'=>0xBFA5, 'K'=>0xC0AB, 'L'=>0xC2E7, 'M'=>0xC4C2, 'N'=>0xC5B5, 'O'=>0xC5BD, 'P'=>0xC6D9, 'Q'=>0xC8BA, 'R'=>0xC8F5, 'S'=>0xCBF9, 'T'=>0xCDD9, 'W'=>0xCEF3, 'X'=>0xD188, 'Y'=>0xD4D0, 'Z'=>0xD7F9, ); function getLetter($input) { global $letters; $input = iconv('UTF-8', 'GB18030', $input); $str = substr($input, 0, 1); if ($str >= chr(0x81) && $str $v){ if($v>=$num) break; } return $k; } else{ return $str; } } exit(getLetter('雪'));

PHP获得汉字拼音首字母的函数

 function getfirstchar($s0){ $firstchar_ord=ord(strtoupper($s0{0})); if (($firstchar_ord>=65 and $firstchar_ord=48 and $firstchar_ord=-20319 and $asc=-20283 and $asc=-19775 and $asc=-19218 and $asc=-18710 and $asc=-18526 and $asc=-18239 and $asc=-17922 and $asc=-17417 and $asc=-16474 and $asc=-16212 and $asc=-15640 and $asc=-15165 and $asc=-14922 and $asc=-14914 and $asc=-14630 and $asc=-14149 and $asc=-14090 and $asc=-13318 and $asc=-12838 and $asc=-12556 and $asc=-11847 and $asc=-11055 and $asc (1158)


