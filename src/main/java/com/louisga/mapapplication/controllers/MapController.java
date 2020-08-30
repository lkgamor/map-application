package com.louisga.mapapplication.controllers;

import com.louisga.mapapplication.config.MapKeysConfiguration;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class MapController {
    
    private final MapKeysConfiguration mapKeysConfiguration;

    @GetMapping("/")
    public String getMap(Model model) {

        model.addAttribute("bingKey", mapKeysConfiguration.getBingKey());
        model.addAttribute("mapboxKey", mapKeysConfiguration.getMapboxKey());
        return "map.html";
    }
}